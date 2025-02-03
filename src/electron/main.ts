import dotenv from "dotenv";
import { app, globalShortcut, protocol } from "electron";
import log from "electron-log";
import path from "path";
import { slideIn, slideOut } from "./electron_components/animations.js";
import { setupIpcHandlers } from "./electron_components/ipcHandlers.js";
import { createLLMProcess } from "./electron_components/llmProcess.js";
import { createTray } from "./electron_components/tray.js";
import { createWakeUpProcess } from "./electron_components/wakeUpProcess.js";
import {
  createAudioWindow,
  createMainWindow,
  createOverlayWindow,
} from "./electron_components/windows.js";
import { getPreloadPath } from "./pathResolver.js";
import { isDev } from "./util.js";

// Set the correct .env file path
const envPath = isDev()
  ? path.resolve(process.cwd(), ".env") // Development: Use .env in root folder
  : path.join(process.resourcesPath, ".env"); // Production: Use bundled .env

dotenv.config({ path: envPath });

let mainWindow: Electron.BrowserWindow;
let overlayWindow: Electron.BrowserWindow;
let audioWindow: Electron.BrowserWindow;
let wakeUpProcess: ReturnType<typeof createWakeUpProcess>;
let llmProcess: ReturnType<typeof createLLMProcess>;
let isQuitting = false;

// Set log file path (correct method)
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath("userData"), "logs", "main.log");

log.info("Env", process.env.SUPABASE_URL);
log.info("Path", getPreloadPath());
app.commandLine.appendSwitch("disable-features", "ChunkedDataPipe");

app.on("ready", async () => {
  const iconPath = isDev()
    ? path.join(app.getAppPath(), "public", "askvoxIcon.ico")
    : path.join(process.resourcesPath, "askvoxIcon.ico");

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
