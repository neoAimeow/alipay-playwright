import { contextBridge, ipcRenderer } from "electron";
import type { IpcRenderer, ContextBridge } from "electron";
import type { IPCRequestOptions } from "../types";

type exposeType = {
  contextBridge: ContextBridge;
  ipcRenderer: IpcRenderer;
};

export const exposeElectronTRPC = ({
  contextBridge,
  ipcRenderer,
}: exposeType) => {
  return contextBridge.exposeInMainWorld("electronTRPC", {
    rpc: (opts: IPCRequestOptions) => ipcRenderer.invoke("electron-trpc", opts),
  });
};

process.once("loaded", () => {
  exposeElectronTRPC({ contextBridge, ipcRenderer });
  contextBridge.exposeInMainWorld("playwrightPlay", () => {
    console.error("1111test");
    ipcRenderer
      .invoke("test")
      .then((res) => {})
      .catch((ex) => {});
  });
});
