import { spawn } from "child_process";
import path from "path";
import { app } from "electron";
import { isDev } from "../util.js";
import os from "node:os";

export function createLLMProcess() {
  // Correct Python script path
  const pythonScriptPath = isDev()
    ? path.join(app.getAppPath(), "src/python/LLM.py") // Development
    : path.join(process.resourcesPath, "python/LLM.py"); // Production

  // Correct Python interpreter path (Handle Windows & macOS/Linux)
  const pythonInterpreterPath = isDev()
    ? path.join(
        app.getAppPath(),
        ".venv",
        os.platform() === "win32" ? "Scripts/python.exe" : "bin/python"
      ) // Development
    : path.join(
        process.resourcesPath,
        "python_env",
        os.platform() === "win32" ? "Scripts/python.exe" : "bin/python"
      ); // Production
  console.log("LLM process started");
  const processLLM = spawn(pythonInterpreterPath, [pythonScriptPath]);

  return {
    process: processLLM,
    kill: () => {
      processLLM.kill();
      console.log("LLM process killed");
    },
  };
}
