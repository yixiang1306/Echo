import { BrowserWindow, ipcMain, screen } from "electron";
import { getPreloadPath } from "../pathResolver.js";
import { isDev } from "../util.js";

export function createMainWindow(iconPath: string) {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  ipcMain.handle("get-env", () => ({
    SUPABASE_URL: process.env.SUPABASE_URL || "NOT_SET",
    SUPABASE_KEY: process.env.SUPABASE_KEY || "NOT_SET",
  }));

  if (isDev()) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadURL("app://index.html");
  }

  return mainWindow;
}

export function createOverlayWindow(iconPath: string) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const overlayWindow = new BrowserWindow({
    icon: iconPath,
    width: 450,
    height,
    frame: false,
    show: false,
    x: width,
    y: 0,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  if (isDev()) {
    overlayWindow.loadURL("http://localhost:3000/overlay");
  } else {
    overlayWindow.loadURL("app://index.html#overlay");
  }

  return overlayWindow;
}

export function createAudioWindow() {
  const audioWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath(),
      sandbox: true,
      webSecurity: true,
    },
  });

  if (isDev()) {
    audioWindow.loadURL("http://localhost:3000/audio");
  } else {
    audioWindow.loadURL("app://index.html#audio");
  }

  return audioWindow;
}
