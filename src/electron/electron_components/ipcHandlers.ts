import { app, ipcMain } from "electron";
import { isDev, MODEL_TYPE } from "../util.js";
import { createLLMProcess } from "./llmProcess.js";
import axios from "axios";
import path from "node:path";
import { createOverlayWindow } from "./windows.js";
import { createWakeUpProcess } from "./wakeUpProcess.js";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export function setupIpcHandlers(
  mainWindow: Electron.BrowserWindow,
  audioWindow: Electron.BrowserWindow,
  llmProcess: ReturnType<typeof createLLMProcess>
) {
  // Add other IPC handlers here...
  // (Move the audio, text-input, send-audio, and calculate-cost handlers here)

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
    console.log("processing...");
    return new Promise((resolve, reject) => {
      llmProcess.process.stdin.write(text + "\n");
      console.log("sent text...");
      console.log("waiting for response...");
      llmProcess.process.stdout.on("data", async (data) => {
        const responseText = data.toString().trim();
        console.log(responseText);

        // Step 1: Start Playing TTS in Parallel
        // Step 1: Request TTS from Google
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

          // Step 2: Send Base64 Audio to Frontend
          audioWindow.webContents.send("play-audio", base64Audio);
        } catch (ttsError) {
          console.error("TTS Error:", ttsError);
        }

        resolve(data.toString());
      });

      llmProcess.process.stderr.on("data", (data) => {
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
}
