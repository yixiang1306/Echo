import { app, globalShortcut } from "electron";
import dotenv from "dotenv";
import path from "path";
import { createWakeUpProcess } from "./electron_components/wakeUpProcess.js";
import { isDev } from "./util.js";
import {
  createAudioWindow,
  createMainWindow,
  createOverlayWindow,
} from "./electron_components/windows.js";
import { createTray } from "./electron_components/tray.js";
import { setupIpcHandlers } from "./electron_components/ipcHandlers.js";
import { slideIn, slideOut } from "./electron_components/animations.js";
import { createLLMProcess } from "./electron_components/llmProcess.js";
import log from "electron-log";
import fs from "fs";
import os from "node:os";
// Set the correct .env file path
const envPath = isDev()
  ? path.resolve(process.cwd(), ".env") // Development: Use .env in root folder
  : path.join(process.resourcesPath, ".env"); // Production: Use bundled .env

// Load environment variables
dotenv.config({ path: envPath });
log.info("Environment variables loaded.", process.env.SUPABASE_KEY);

let mainWindow: Electron.BrowserWindow;
let overlayWindow: Electron.BrowserWindow;
let audioWindow: Electron.BrowserWindow;
let wakeUpProcess: ReturnType<typeof createWakeUpProcess>;
let llmProcess: ReturnType<typeof createLLMProcess>;
let isQuitting: boolean = false;

app.commandLine.appendSwitch("disable-features", "ChunkedDataPipe");

app.on("ready", async () => {
  const iconPath = isDev()
    ? path.join(app.getAppPath(), "assets", "icons", "echo-win.ico") // Use app.getAppPath() for dev
    : path.join(process.resourcesPath, "assets", "icons", "echo-win.ico"); // Use process.resourcesPath for prod

  // Create windows
  mainWindow = createMainWindow(iconPath);
  overlayWindow = createOverlayWindow(iconPath);
  audioWindow = createAudioWindow();

  // Setup Python process
  wakeUpProcess = createWakeUpProcess();
  llmProcess = createLLMProcess();

  // Setup tray
  createTray(iconPath, mainWindow);

  // Setup IPC handlers
  setupIpcHandlers(mainWindow, audioWindow, llmProcess);

  // Window event handlers
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Global shortcuts
  globalShortcut.register("Alt+V", () => handleOverlayToggle());
  globalShortcut.register("Alt+C", () =>
    audioWindow.webContents.send("stop-audio")
  );

  // Python process communication
  wakeUpProcess.process.stdout.on("data", async (data: Buffer) => {
    console.log(data.toString().trim() === "wake-up");
    if (data.toString().trim() === "wake-up") {
      overlayWindow.show();
      await slideIn(overlayWindow);
    }
  });
});

// Cleanup before quit
app.on("before-quit", () => {
  wakeUpProcess.kill();
  llmProcess.kill();
});

function cleanUpExtractedFiles() {
  const tempDir = path.join(os.tmpdir(), "dist-react");
  if (fs.existsSync(tempDir)) {
    fs.rmdirSync(tempDir, { recursive: true });
  }
}

app.on("window-all-closed", cleanUpExtractedFiles);

// Handle Alt+V
async function handleOverlayToggle() {
  console.log("Alt+V pressed.");
  if (overlayWindow.isVisible()) {
    await slideOut(overlayWindow);
    overlayWindow.hide();
    console.log("hide overlay");
    wakeUpProcess.resume();
  } else {
    overlayWindow.show();
    console.log("show overlay");
    await slideIn(overlayWindow);
    wakeUpProcess.pause();
  }
}

//Handle quitting parameters

export function setQuitting(quit: boolean) {
  isQuitting = quit;
}
