import { ipcMain } from "electron";
import { MODEL_TYPE } from "../util.js";
import { createLLMProcess } from "./llmProcess.js";



export function setupIpcHandlers(mainWindow: Electron.BrowserWindow, audioWindow: Electron.BrowserWindow, llmProcess: ReturnType<typeof createLLMProcess>) {
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
      console.log("processing...");
      return new Promise((resolve, reject) => {
        llmProcess.process.stdin.write(text+'\n');  
        console.log("sent text...");
        console.log("waiting for response...");
        llmProcess.process.stdout.on('data', (data) => {
          console.log(data.toString());
          resolve(data.toString());
        });
        
        llmProcess.process.stderr.on('data', (data) => {
          console.error(`Python Error: ${data}`);
          reject(data.toString());
        });
      })
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




