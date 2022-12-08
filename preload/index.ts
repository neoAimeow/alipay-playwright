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
  return contextBridge.exposeInMainWorld("launchPlaywright", () => {
    console.error("1111test");
    ipcRenderer
      .invoke("launchPlaywright")
      .then((res) => {})
      .catch((ex) => {});
  });
};

process.once("loaded", () => {
  exposePlaywright({ contextBridge, ipcRenderer });
  exposeElectronTRPC({ contextBridge, ipcRenderer });
});
