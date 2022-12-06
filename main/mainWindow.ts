import { app, BrowserWindow } from "electron";
import { join } from "path";
import { URL } from "url";
import * as electron from "electron";

export const pageUrl =
  import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
    ? import.meta.env.VITE_DEV_SERVER_URL
    : new URL("../renderer/dist/index.html", "file://" + __dirname).toString();

async function createWindow() {
  const winW = electron.screen.getPrimaryDisplay().workAreaSize.width - 50;

  const winH = electron.screen.getPrimaryDisplay().workAreaSize.height - 50;

  const browserWindow = new BrowserWindow({
    show: false,
    height: winH,
    width: winW,
    webPreferences: {
      allowRunningInsecureContent: false,
      enableBlinkFeatures: "",
      experimentalFeatures: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      preload: join(app.getAppPath(), "preload/dist/index.cjs"),
    },
  });

  browserWindow.on("ready-to-show", () => {
    browserWindow.show();

    if (import.meta.env.DEV) {
      browserWindow.webContents.openDevTools();
    }
  });

  await browserWindow.loadURL(pageUrl);

  return browserWindow;
}

export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
}
