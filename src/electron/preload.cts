import { contextBridge, ipcRenderer } from "electron/renderer";

enum MODEL_TYPE {
  ASKVOX = "ASKVOX",
  GPT_4o = "GPT_4o",
}

contextBridge.exposeInMainWorld("nodeAPI", {
  Buffer: (base64String: string) => Buffer.from(base64String, "base64"), // Buffer conversion function
});

contextBridge.exposeInMainWorld("electron", {
  getEnv: () => ipcRenderer.invoke("get-env"),
  openWindows: () => ipcRenderer.send("open-windows"),
  killWindows: () => ipcRenderer.send("kill-windows"),
});

contextBridge.exposeInMainWorld("tokenManagerApi", {
  calculateCost: (text: { input: string; output: string }, model: MODEL_TYPE) =>
    ipcRenderer.invoke("calculate-cost", text, model),
});

contextBridge.exposeInMainWorld("electronAPI", {
  toggleRecording: (recording: boolean) =>
    ipcRenderer.send("toggle-recording", recording),
  textInput: (text: string) => ipcRenderer.invoke("text-input", text),
  sendAudio: (base64Audio: string) =>
    ipcRenderer.invoke("send-audio", base64Audio),
});

// Expose a new audioManagerAPI
contextBridge.exposeInMainWorld("audioManagerAPI", {
  playAudio: (audioBase64: string) =>
    ipcRenderer.send("play-audio", audioBase64),
  stopAudio: () => ipcRenderer.send("stop-audio"),
  pauseAudio: () => ipcRenderer.send("pause-audio"),
  resumeAudio: () => ipcRenderer.send("resume-audio"),

  // Event listeners for play and stop audio
  onPlayAudio: (callback: (audioBase64: string) => void) =>
    ipcRenderer.on("play-audio", (_, audioBase64) => callback(audioBase64)),
  onStopAudio: (callback: () => void) =>
    ipcRenderer.on("stop-audio", () => callback()),

  // Remove listeners to prevent memory leaks
  removePlayAudioListener: () => ipcRenderer.removeAllListeners("play-audio"),
  removeStopAudioListener: () => ipcRenderer.removeAllListeners("stop-audio"),
});

// Expose Buffer to renderer process
