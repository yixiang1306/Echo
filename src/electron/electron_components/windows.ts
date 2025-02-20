import { BrowserWindow, ipcMain, screen, session } from "electron";
import path from "path";
import { getPreloadPath } from "../pathResolver.js";
import { isDev } from "../util.js";
import asar from "asar";
import os from "node:os";
import fs from "fs";

function extractAsar() {
  const distPath = path.join(process.resourcesPath, "app.asar"); // Path to the asar archive
  const tempDir = path.join(os.tmpdir(), "dist-react"); // Temporary directory for extracted files

  // If files have not been extracted yet, perform the extraction
  if (!fs.existsSync(tempDir)) {
    asar.extractAll(distPath, tempDir);
  }
  return path.join(tempDir, "dist-react", "index.html");
}

export function createMainWindow(iconPath: string) {
  ipcMain.handle("get-env", () => ({
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_KEY: process.env.SUPABASE_KEY || "",
  }));

  const mainWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().workAreaSize.width,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    minWidth: 1000,
    minHeight: 800,
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startURL = isDev()
    ? "http://localhost:3000/#/app"
    : `file://${extractAsar()}#/app`;

  mainWindow.loadURL(startURL);
  // Show the window only when it's fully ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize(); // Start maximized
    mainWindow.show();
  });
  return mainWindow;
}

export function createSideBarWindow(
  mainWindow: Electron.BrowserWindow,
  iconPath: string
) {
  if (!mainWindow) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const sideBarWindow = new BrowserWindow({
    parent: mainWindow,
    icon: iconPath,
    width: 450,
    height,
    transparent: true, // Transparent background
    frame: false,
    show: false,
    x: width - 450,
    y: 0,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      session: mainWindow.webContents.session,
    },
  });

   //@ts-ignore
  sideBarWindow.isAlwaysOnTop(true,"screen-saver");

  const sidebarURL = isDev()
    ? "http://localhost:3000/#/sidebar"
    : `file://${extractAsar()}#/sidebar`;

  sideBarWindow.loadURL(sidebarURL);
  return sideBarWindow;
}

export function createAudioWindow(mainWindow: Electron.BrowserWindow) {
  if (!mainWindow) return;
  const audioWindow = new BrowserWindow({
    parent: mainWindow, // ✅ Set parent
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath(),
      session: mainWindow.webContents.session,
    },
  });

  const audioURL = isDev()
    ? "http://localhost:3000/#/audio"
    : `file://${extractAsar()}#/audio`;

  audioWindow.loadURL(audioURL);
  return audioWindow;
}

export function createOverlayWindow(
  mainWindow: Electron.BrowserWindow,
  iconPath: string
) {
  if (!mainWindow) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const overlayWindow = new BrowserWindow({
    parent: mainWindow,
    icon: iconPath,
    width: 450,
    height,
    transparent: true, // Transparent background
    frame: false,
    show: true,
    x: width - 450,
    y: 0,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      session: mainWindow.webContents.session,
    },
  });

  //@ts-ignore
  overlayWindow.isAlwaysOnTop(true,"screen-saver");

  // Make the window click-through (mouse ignores it)
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  const overlayURL = isDev()
    ? "http://localhost:3000/#/overlay"
    : `file://${extractAsar()}#/overlay`;

  overlayWindow.loadURL(overlayURL);
  return overlayWindow;
}
