import type { AppRouter } from "../api/router";
import { createTRPCReact } from "@trpc/react-query";
import type { GetInferenceHelpers } from "@trpc/server";

import {
  createTRPCProxyClient,
  TRPCClientError,
  TRPCClientRuntime,
  TRPCLink,
} from "@trpc/client";
import { AnyRouter, inferRouterError } from "@trpc/server";
import {
  TRPCResponse,
  TRPCResponseMessage,
  TRPCResultMessage,
} from "@trpc/server/rpc";
import { observable } from "@trpc/server/observable";

// export const trpcClient = createTRPCProxyClient<AppRouter>({
//   links: [ipcLink()],
// });

export const trpc = createTRPCReact<AppRouter>();

export type InferProcedures = GetInferenceHelpers<AppRouter>;

function transformResult<TRouter extends AnyRouter, TOutput>(
  response:
    | TRPCResponseMessage<TOutput, inferRouterError<TRouter>>
    | TRPCResponse<TOutput, inferRouterError<TRouter>>,
  runtime: TRPCClientRuntime
) {
  if ("error" in response) {
    const error = runtime.transformer.deserialize(
      response.error
    ) as inferRouterError<TRouter>;
    return {
      ok: false,
      error: {
        ...response,
        error,
      },
    } as const;
  }

  const result = {
    ...response.result,
    ...((!response.result.type || response.result.type === "data") && {
      type: "data",
      data: runtime.transformer.deserialize(response.result.data) as unknown,
    }),
  } as TRPCResultMessage<TOutput>["result"];
  return { ok: true, result } as const;
}

export function ipcLink<TRouter extends AnyRouter>(): TRPCLink<TRouter> {
  return (runtime) =>
    ({ op }) => {
      return observable((observer) => {
        const promise = window.electronTRPC.rpc(op);

        promise
          .then((res) => {
            const transformed = transformResult(res.response, runtime);

            if (!transformed.ok) {
              observer.error(TRPCClientError.from(transformed.error));
              return;
            }
            observer.next({
              result: transformed.result,
            });
            observer.complete();
          })
          .catch((cause: Error) => observer.error(TRPCClientError.from(cause)));

        return () => {
          // cancel promise here
        };
      });
    };
}
