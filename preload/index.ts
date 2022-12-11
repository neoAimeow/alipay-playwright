import { contextBridge, ipcRenderer } from "electron";
import type { IpcRenderer, ContextBridge } from "electron";
import type { IPCRequestOptions } from "../types";
import { Order } from "../api/router/order";

interface exposeType {
  contextBridge: ContextBridge;
  ipcRenderer: IpcRenderer;
}

export const exposeElectronTRPC = ({
  contextBridge,
  ipcRenderer,
}: exposeType) => {
  return contextBridge.exposeInMainWorld("electronTRPC", {
    rpc: (opts: IPCRequestOptions) => ipcRenderer.invoke("electron-trpc", opts),
  });
};

export const exposePlaywright = ({
  contextBridge,
  ipcRenderer,
}: exposeType) => {
  return contextBridge.exposeInMainWorld("playwright", {
    pay: (orders: Order[]) => ipcRenderer.invoke("playwright-pay", orders),
    login: () => ipcRenderer.invoke("playwright-login"),
  });
};

process.once("loaded", () => {
  exposeElectronTRPC({ contextBridge, ipcRenderer });
  exposePlaywright({ contextBridge, ipcRenderer });
});
