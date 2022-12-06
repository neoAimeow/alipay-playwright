import { useState } from "react";
import { trpc } from "../../utils/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, TRPCClientRuntime } from "@trpc/client";
import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { AnyRouter, inferRouterError } from "@trpc/server";
import {
  TRPCResponse,
  TRPCResponseMessage,
  TRPCResultMessage,
} from "@trpc/server/rpc";

import "./App.css";
import axios from "axios";
import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import HomeView from "./pages/home-page/home-view";
import AccountView from "./pages/account-manager/account-view";
import LogView from "./pages/log-view/log-view";
import LoginView from "./pages/login-view/login-view";
import ConfigView from "./pages/config-view/config-view";
import OrderListView from "./pages/order/order-list-view";

export const switchUrl = "http://rlaecyw7w.bkt.clouddn.com/switch.json";

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

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => {
    return trpc.createClient({
      links: [ipcLink()],
    });
  });
  const [valid, setValid] = useState(false);

  axios
    .get(switchUrl)
    .then((res: { data: { isAppValid: boolean } }) => {
      const { isAppValid } = res.data;
      setValid(isAppValid);
    })
    .catch(() => {
      setValid(false);
    });

  return valid ? (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<HomeView />}>
              {/* <Route index element={<Dashboard />} /> */}
              <Route path="/account" element={<AccountView />} />
              {/*<Route index element={<AccountView />} />*/}
              <Route path="/log" element={<LogView />} />
              <Route path="/config" element={<ConfigView />} />
              <Route path="/order-list" element={<OrderListView />} />
              <Route path="/log" element={<LogView />} />
              <Route path="/login" element={<LoginView />} />
              <Route index element={<LoginView />} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </trpc.Provider>
  ) : (
    <div>该应用不可用。请联系开发者</div>
  );
}

export default App;
