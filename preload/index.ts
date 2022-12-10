import { contextBridge, ipcRenderer } from "electron";
import type { IpcRenderer, ContextBridge } from "electron";
import type { IPCRequestOptions } from "../types";

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
    test: (link: string) => ipcRenderer.invoke("playwright-test", link),
    pay: () => ipcRenderer.invoke("playwright-pay"),
    login: () => ipcRenderer.invoke("playwright-login"),
  });
};
// export const payIpc = (link: string) => {
//   ipcRenderer
//     .invoke("playwright-test", link)
//     .then((res) => {})
//     .catch((ex) => {});
// };

process.once("loaded", () => {
  exposeElectronTRPC({ contextBridge, ipcRenderer });
  exposePlaywright({ contextBridge, ipcRenderer });
});
