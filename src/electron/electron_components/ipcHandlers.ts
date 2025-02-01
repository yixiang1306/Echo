import { ipcMain } from "electron";
import axios from "axios";
import { MODEL_TYPE } from "../util.js";



export function setupIpcHandlers(mainWindow: Electron.BrowserWindow, audioWindow: Electron.BrowserWindow) {
    ipcMain.handle('get-env', () => ({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
    }));
  
    // Add other IPC handlers here...
    // (Move the audio, text-input, send-audio, and calculate-cost handlers here)
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
    try {
        const response = await axios.post("http://localhost:8000/llm", { text });
        const llmResponse = response.data.llm_response;
    
        const ttsResponse = await axios.post("http://localhost:8000/tts", { text: llmResponse });
        const audioBase64 = ttsResponse.data.audio_base64;
    
        audioWindow?.webContents.send("play-audio", audioBase64);
        return llmResponse;
        } catch (error) {
        return "Error communicating with the server.";
        }
    });
  
    ipcMain.handle("calculate-cost", (_, text: { input: string; output: string }, model: MODEL_TYPE) => {
        const getInputTokenCount = (text: string) => Math.ceil(text.trim().split(/\s+/).length * 1.33);
    
        const pricing = {
        [MODEL_TYPE.ASKVOX]: { input: 0.03 / 1000, output: 0.06 / 1000 },
        [MODEL_TYPE.GPT_4o]: { input: 0.0015 / 1000, output: 0.002 / 1000 },
        };
    
        const modelPricing = pricing[model] || pricing[MODEL_TYPE.ASKVOX];
    
        const inputTokens = getInputTokenCount(text.input);
        const outputTokens = getInputTokenCount(text.output);
        const totalCost = inputTokens * modelPricing.input + outputTokens * modelPricing.output;
    
        return { inputTokens, outputTokens, totalCost: totalCost.toFixed(6) };
    });

}




