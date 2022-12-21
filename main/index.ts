import { app, ipcMain } from "electron";
import type { IpcMain } from "electron";
import "./security-restrictions";
import { restoreOrCreateWindow, pageUrl } from "./mainWindow";
import { callProcedure, TRPCError } from "@trpc/server";
import type {
  AnyRouter,
  inferRouterContext,
  inferRouterError,
} from "@trpc/server";
import type { TRPCResponse, TRPCResponseMessage } from "@trpc/server/rpc";
import { createContext } from "../api/context";
import { appRouter } from "../api/router";
import type { IPCRequestOptions, IPCResponse } from "../types";
import { AlipayPlayWright } from "../playwright/alipay";
// import { trpcClient } from "../utils/trpc";
import { Order } from "../api/router/order";
import FormData from "form-data";
import { CacheManager } from "../utils/cache";
import request from "../utils/axios";
import { prisma } from "../api/db/client";

const isSingleInstance = app.requestSingleInstanceLock();
if (!isSingleInstance) {
  app.quit();
  process.exit(0);
}
app.on("second-instance", () => {
  restoreOrCreateWindow().catch((err) => {
    throw err;
  });
});

app.disableHardwareAcceleration();

app.on("window-all-closed", async () => {
  // trpcClient.user.heartBeatDown.mutate();
  await tearDown();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

const tearDown = async () => {
  const form = new FormData();
  form.append("func", "alipayStatus");
  form.append(
    "user",
    (await CacheManager.getInstance(prisma).getStore("username")) ?? ""
  );
  form.append(
    "params",
    JSON.stringify({
      status: 0,
    })
  );
  form.append(
    "token",
    (await CacheManager.getInstance(prisma).getStore("token")) ?? ""
  );
  await request.post("", form);
};

app.on("activate", () => {
  restoreOrCreateWindow().catch((err) => {
    throw err;
  });
});

app
  .whenReady()
  .then(async () => {
    await restoreOrCreateWindow().catch((err) => {
      throw err;
    });
  })
  .catch((e) => console.error("Failed create window:", e));

function transformTRPCResponseItem<
  TResponseItem extends TRPCResponse | TRPCResponseMessage
>(router: AnyRouter, item: TResponseItem): TResponseItem {
  if ("error" in item) {
    return {
      ...item,
      error: appRouter._def._config.transformer.output.serialize(
        item.error
      ) as unknown,
    };
  }

  if ("data" in item.result) {
    return {
      ...item,
      result: {
        ...item.result,
        data: appRouter._def._config.transformer.output.serialize(
          item.result.data
        ) as unknown,
      },
    };
  }

  return item;
}

function getMessageFromUnkownError(err: unknown, fallback: string): string {
  if (typeof err === "string") {
    return err;
  }

  if (err instanceof Error && typeof err.message === "string") {
    return err.message;
  }
  return fallback;
}

function getErrorFromUnknown(cause: unknown): Error {
  if (cause instanceof Error) {
    return cause;
  }
  const message = getMessageFromUnkownError(cause, "Unknown error");
  return new Error(message);
}

function getTRPCErrorFromUnknown(cause: unknown): TRPCError {
  const error = getErrorFromUnknown(cause);
  if (error.name === "TRPCError") {
    return cause as TRPCError;
  }

  const trpcError = new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    cause: error,
    message: error.message,
  });

  trpcError.stack = error.stack;

  return trpcError;
}

function validateSender(frame: Electron.WebFrameMain) {
  const frameUrlObj = new URL(frame.url);
  const pageUrlObj = new URL(pageUrl);

  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_DEV_SERVER_URL !== undefined
  ) {
    if (frameUrlObj.host === pageUrlObj.host) return true;
  } else {
    if (frameUrlObj.protocol === "file:") return true;
  }

  return false;
}

export function createIPCHandler({ ipcMain }: { ipcMain: IpcMain }) {
  ipcMain.handle(
    "electron-trpc",
    (event: Electron.IpcMainInvokeEvent, opts: IPCRequestOptions) => {
      if (!validateSender(event.senderFrame)) return null;
      return resolveIPCResponse(opts);
    }
  );

  ipcMain.handle("playwright-login", async () => {
    await AlipayPlayWright.getInstance().login();
  });

  ipcMain.handle("playwright-pay", async (event, orders: Order[]) => {
    await AlipayPlayWright.getInstance().addTasks(orders);
  });
}

async function resolveIPCResponse<TRouter extends AnyRouter>(
  opts: IPCRequestOptions
): Promise<IPCResponse> {
  const { type, input: serializedInput } = opts;
  const { transformer } = appRouter._def._config;
  const deserializedInput = transformer.input.deserialize(
    serializedInput
  ) as unknown;

  type TRouterError = inferRouterError<TRouter>;
  type TRouterResponse = TRPCResponse<unknown, TRouterError>;

  const ctx = await createContext();

  if (type === "subscription") {
    throw new TRPCError({
      message: "Subscriptions should use wsLink",
      code: "METHOD_NOT_SUPPORTED",
    });
  }

  type RawResult =
    | { input: unknown; path: string; data: unknown }
    | { input: unknown; path: string; error: TRPCError };

  async function getRawResult(
    ctx: inferRouterContext<TRouter>
  ): Promise<RawResult> {
    const { path, type } = opts;
    const { procedures } = appRouter._def;

    try {
      const output = await callProcedure({
        ctx,
        path,
        procedures,
        rawInput: deserializedInput,
        type,
      });
      return {
        input: deserializedInput,
        path,
        data: output,
      };
    } catch (cause) {
      const error = getTRPCErrorFromUnknown(cause);
      return {
        input: deserializedInput,
        path,
        error,
      };
    }
  }

  function getResultEnvelope(rawResult: RawResult): TRouterResponse {
    const { path, input } = rawResult;

    if ("error" in rawResult) {
      return {
        error: appRouter.getErrorShape({
          error: rawResult.error,
          type,
          path,
          input,
          ctx,
        }),
      };
    } else {
      return {
        result: {
          data: rawResult.data,
        },
      };
    }
  }

  function getEndResponse(envelope: TRouterResponse): IPCResponse {
    const transformed = transformTRPCResponseItem(appRouter, envelope);

    return {
      response: transformed,
    };
  }

  try {
    const rawResult = await getRawResult(ctx);
    const resultEnvelope = getResultEnvelope(rawResult);

    return getEndResponse(resultEnvelope);
  } catch (cause) {
    const { input, path } = opts;
    const error = getTRPCErrorFromUnknown(cause);
    const resultEnvelope = getResultEnvelope({ input, path, error });

    return getEndResponse(resultEnvelope);
  }
}

app.on("ready", () => {
  createIPCHandler({ ipcMain });
});
