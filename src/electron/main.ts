import dotenv from "dotenv";
import { app, globalShortcut, ipcMain } from "electron";
import log from "electron-log";
import fs from "fs";
import os from "node:os";
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
import { isDev } from "./util.js";
// Set the correct .env file path
const envPath = isDev()
  ? path.resolve(process.cwd(), ".env") // Development: Use .env in root folder
  : path.join(process.resourcesPath, ".env"); // Production: Use bundled .env

// Load environment variables
dotenv.config({ path: envPath });
log.info("Environment variables loaded.", process.env.SUPABASE_KEY);

let mainWindow: Electron.BrowserWindow;
let overlayWindow: Electron.BrowserWindow | null = null;
let audioWindow: Electron.BrowserWindow;
let wakeUpProcess: ReturnType<typeof createWakeUpProcess>;
let llmProcess: ReturnType<typeof createLLMProcess>;
let isQuitting: boolean = false;
app.commandLine.appendSwitch("disable-features", "ChunkedDataPipe");

let isOverlayToggling = false; // Prevent spam


app.on("ready", async () => {
  const iconPath = isDev()
    ? path.join(app.getAppPath(), "assets", "icons", "echo-win.ico") // Use app.getAppPath() for dev
    : path.join(process.resourcesPath, "assets", "icons", "echo-win.ico"); // Use process.resourcesPath for prod

  // Create windows
  mainWindow = createMainWindow(iconPath);
  audioWindow = createAudioWindow(mainWindow)!;

  //IPC Functions
  //Trigger Overlay and wakeup process from app ui
  ipcMain.on("open-windows", (event) => {
    // Get the sender's webContents
    const senderWebContents = event.sender;

    // Check if the sender is the main window before proceeding
    if (mainWindow && senderWebContents === mainWindow.webContents) {
      console.log("✅ Opening other windows from MAIN window");
      if(!wakeUpProcess) wakeUpProcess = createWakeUpProcess();

      if(!overlayWindow){ 
        console.log("yes");
        overlayWindow = createOverlayWindow(mainWindow, iconPath)!;
        overlayWindow.on("blur" , async() => {
        await slideOut(overlayWindow!);
        overlayWindow!.hide();
        wakeUpProcess!.resume();
      });
      };
      // Global shortcuts
      globalShortcut.register("Alt+C", () =>
        audioWindow.webContents.send("stop-audio")
      );
      globalShortcut.register("Alt+V", () => handleOverlayToggle());

      wakeUpProcess.process.stdout.on("data", async (data: Buffer) => {
        console.log(data.toString().trim());
        if (data.toString().trim() === "wake-up") {
          console.log("true");
          overlayWindow?.show();
          if (overlayWindow) {
            await slideIn(overlayWindow);
          }
        }
      
      
      
      });

      

    } else {
      console.warn(
        "⚠️ Unauthorized attempt to open windows from a non-main window."
      );
    }
  });
  //Trigger Overlay and wakeup process when logout
  ipcMain.on("kill-windows", (event) => {
    const senderWebContents = event.sender;

    if (mainWindow && senderWebContents === mainWindow.webContents) {
      console.log("Closing other windows from MAIN window");

      // ✅ Destroy the overlay window properly
      if (overlayWindow) {
        overlayWindow.close(); // Close the window
        overlayWindow.destroy(); // Destroy it completely
        overlayWindow = null; // Remove reference
      }
      wakeUpProcess.kill();
      console.log("✅ wakeUpProcess killed successfully");
      globalShortcut.unregister("Alt+V");
      console.log("✅ Unregistered global shortcut");
    } else {
      console.warn(
        "⚠️ Unauthorized attempt to close windows from a non-main window."
      );
    }
  });
  // Setup Python process
  llmProcess = createLLMProcess();
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
});

// Cleanup before quit
app.on("before-quit", () => {
  wakeUpProcess?.kill();
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
  if (isOverlayToggling) return; // Prevent rapid toggles
  isOverlayToggling = true;

  console.log("Alt+V pressed.");

  if (overlayWindow!.isVisible()) {
    await slideOut(overlayWindow!);
    overlayWindow!.hide();
    console.log("hide overlay");
    wakeUpProcess!.resume();
  } else {
    overlayWindow!.show();
    console.log("show overlay");
    await slideIn(overlayWindow!);
    wakeUpProcess!.pause();
  }

  // Set cooldown (adjust delay as needed)
  setTimeout(() => {
    isOverlayToggling = false;
  }, 200); // Prevents spamming for 500ms
}

//Handle quitting parameters

export function setQuitting(quit: boolean) {
  isQuitting = quit;
}
