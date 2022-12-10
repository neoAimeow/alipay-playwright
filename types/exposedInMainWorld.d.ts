// https://www.electronjs.org/docs/latest/tutorial/context-isolation#usage-with-typescript
interface Window {
  readonly playwrightLogin: () => void;
  readonly playwrightPay: () => void;

  readonly electronTRPC: {
    rpc: (
      op: import("./index").IPCRequestOptions
    ) => Promise<import("./index").IPCResponse>;
  };
}
