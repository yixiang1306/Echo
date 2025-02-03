import { spawn } from "child_process";
import path from "path";
import { app } from "electron";
import { isDev } from "../util.js";
import os from "node:os";

// const pythonScriptPath = path.join(app.getAppPath(), "./src/python/LLM.py");
// const pythonInterpreterPath = path.join(
//   app.getAppPath(),
//   "./.venv/Scripts/python.exe"
// );

const pythonScriptPath = isDev()
  ? path.join(app.getAppPath(), "./src/python/LLM.py") // Development
  : path.join(process.resourcesPath, "python/LLM.py"); // Production

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
    );

export function createLLMProcess() {
  console.log("From LLM", os.platform());
  console.log(pythonInterpreterPath);
  console.log(pythonScriptPath);
  console.log("process started");
  const process = spawn(pythonInterpreterPath, [pythonScriptPath]);

  return {
    process,
    kill: () => process.kill(),
  };
}
