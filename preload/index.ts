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

export const exposePlaywrightLogin = ({
  contextBridge,
  ipcRenderer,
}: exposeType) => {
  return contextBridge.exposeInMainWorld("playwrightLogin", () => {
    ipcRenderer
      .invoke("playwright-login")
      .then((res) => {})
      .catch((ex) => {});
  });
};

export const exposePlaywrightPay = ({
                                        contextBridge,
                                        ipcRenderer,
                                      }: exposeType) => {
  return contextBridge.exposeInMainWorld("playwrightPay", () => {
    ipcRenderer
      .invoke("playwright-pay")
      .then((res) => {})
      .catch((ex) => {});
  });
};

process.once("loaded", () => {
  exposePlaywrightLogin({ contextBridge, ipcRenderer });
  exposePlaywrightPay({ contextBridge, ipcRenderer });
  exposeElectronTRPC({ contextBridge, ipcRenderer });
});
