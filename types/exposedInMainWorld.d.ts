// https://www.electronjs.org/docs/latest/tutorial/context-isolation#usage-with-typescript

interface Window {
  readonly playwright: {
    pay: (orders: any[]) => void;
    loginAll: () => void;
    login: (item: any) => void;
  };

  readonly electronTRPC: {
    rpc: (
      op: import("./index").IPCRequestOptions
    ) => Promise<import("./index").IPCResponse>;
  };
}
