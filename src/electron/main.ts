import dotenv from "dotenv";
import { app, globalShortcut, ipcMain, Tray } from "electron";
import log from "electron-log";
import fs from "fs";
import os from "node:os";
import path from "path";
import { slideIn, slideOut } from "./electron_components/animations.js";
import { createLLMProcess } from "./electron_components/llmProcess.js";
import { createTray } from "./electron_components/tray.js";
import { createWakeUpProcess } from "./electron_components/wakeUpProcess.js";
import {
  createAudioWindow,
  createMainWindow,
  createOverlayWindow,
} from "./electron_components/windows.js";
import { isDev, MODEL_TYPE } from "./util.js";
import axios from "axios";
// Set the correct .env file path
const envPath = isDev()
  ? path.resolve(process.cwd(), ".env") // Development: Use .env in root folder
  : path.join(process.resourcesPath, ".env"); // Production: Use bundled .env

// Load environment variables
dotenv.config({ path: envPath });
log.info("Environment variables SUPABASE_KEY.", process.env.SUPABASE_KEY);
log.info("Environment variables GOOGLE_API_KEY.", process.env.GOOGLE_API_KEY);
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

let mainWindow: Electron.BrowserWindow;
let overlayWindow: Electron.BrowserWindow | null = null;
let audioWindow: Electron.BrowserWindow;
let wakeUpProcess: ReturnType<typeof createWakeUpProcess>;
let llmProcess: ReturnType<typeof createLLMProcess>;
let isQuitting: boolean = false;
let tray: Tray | null = null;
app.commandLine.appendSwitch("disable-features", "ChunkedDataPipe");

const iconPath = isDev()
    ? path.join(app.getAppPath(), "assets", "icons", "echo-win.ico") // Use app.getAppPath() for dev
    : path.join(process.resourcesPath, "assets", "icons", "echo-win.ico"); // Use process.resourcesPath for prod

app.on("ready", async () => {
  // Create windows
  mainWindow = createMainWindow(iconPath);
  tray = createTray(iconPath, mainWindow);
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
  // setupIpcHandlers(mainWindow, audioWindow, llmProcess);

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
  console.log("Alt+V pressed.");

  if (overlayWindow!.isVisible()) {
    await slideOut(overlayWindow!);
    overlayWindow!.hide();
    console.log("hide overlay");
   
  } else {
    overlayWindow!.show();
    console.log("show overlay");
    await slideIn(overlayWindow!);
    wakeUpProcess!.pause();
  }

}

//Handle quitting parameters

export function setQuitting(quit: boolean) {
  isQuitting = quit;
}



//IPC Functions

ipcMain.handle("send-audio", async (_, base64Audio: string) => {
  try {
    console.log("Received Audio Data Length:", base64Audio?.length || 0);

    if (!base64Audio || base64Audio.length === 0) {
      console.log("Error: No audio data received.");
      return "Error: No audio data received.";
    }

    // Step 2: Prepare API Request for Google STT
    const requestBody = {
      config: {
        encoding: "WEBM_OPUS", // Set the encoding to WEBM_OPUS
        sampleRateHertz: 48000, // Adjust sample rate to match your recording
        languageCode: "en-US", // Modify based on the language of the audio
      },
      audio: {
        content: base64Audio, // Base64-encoded audio data
      },
    };

    // Step 3: Send Request to Google Speech-to-Text API
    const response = await axios.post(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Step 4: Extract Transcription Result
    const transcription =
      response.data.results
        ?.map((result: any) => result.alternatives[0].transcript)
        .join("\n") || "No speech detected.";

    return transcription;
  } catch (error) {
    console.error("Error processing audio:", error);
    return "Error processing your request. Please try again.";
  }
});

ipcMain.handle("play-audio", (_, audioBase64: string) => {
  if (mainWindow) {
    mainWindow.webContents.send("play-audio", audioBase64);
  }
});

ipcMain.handle("stop-audio", () => {
  if (mainWindow) {
    mainWindow.webContents.send("stop-audio");
  }
});

ipcMain.handle("text-input", async (_, text: string) => {
  return new Promise((resolve, reject) => {
    llmProcess.process.stdin.write(text + "\n");
    console.log("sent text...");
    console.log("waiting for response...");

    llmProcess.process.stdout.once("data", (data) => {
      const responseText = data.toString().trim();
      console.log(responseText);

      // Send response text immediately
      resolve(responseText);

      // Check if response is an image or a YouTube link
      const isImage = /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(responseText);
      const isYouTubeLink = /(?:youtube\.com\/embed\/|youtu\.be\/)/i.test(responseText);

      if (!isImage && !isYouTubeLink) {
        // Request TTS from Google asynchronously
        (async () => {
          try {
            const ttsResponse = await axios.post(
              `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
              {
                input: { text: responseText },
                voice: {
                  languageCode: "en-US",
                  name: "en-US-Journey-F",
                  ssmlGender: "NEUTRAL",
                },
                audioConfig: { audioEncoding: "MP3" },
              },
              { headers: { "Content-Type": "application/json" } }
            );

            const base64Audio = ttsResponse.data.audioContent;
            console.log("TTS Audio Generated (Base64)");

            // Send Base64 Audio to Frontend after response
            audioWindow.webContents.send("play-audio", base64Audio);
          } catch (ttsError) {
            console.error("TTS Error:", ttsError);
          }
        })();
      } else {
        console.log("Response is an image or YouTube link, skipping TTS.");
      }
    });

    llmProcess.process.stderr.once("data", (data) => {
      console.error(`Python Error: ${data}`);
      reject(data.toString());
    });
  });
});

ipcMain.handle(
  "calculate-cost",
  (_, text: { input: string; output: string }, model: MODEL_TYPE) => {
    const getInputTokenCount = (text: string) =>
      Math.ceil(text.trim().split(/\s+/).length * 1.33);

    const pricing = {
      [MODEL_TYPE.ASKVOX]: { input: 0.03 / 1000, output: 0.06 / 1000 },
      [MODEL_TYPE.GPT_4o]: { input: 0.0015 / 1000, output: 0.002 / 1000 },
    };

    const modelPricing = pricing[model] || pricing[MODEL_TYPE.ASKVOX];

    const inputTokens = getInputTokenCount(text.input);
    const outputTokens = getInputTokenCount(text.output);
    const totalCost =
      inputTokens * modelPricing.input + outputTokens * modelPricing.output;

    return { inputTokens, outputTokens, totalCost: totalCost.toFixed(6) };
  }
);
