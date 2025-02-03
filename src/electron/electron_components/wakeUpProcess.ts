import { spawn } from "child_process";
import path from "path";
import { app } from "electron";
import { isDev } from "../util.js";
import os from "node:os";

// const pythonScriptPath = path.join(app.getAppPath(), "./src/python/HeyVox.py");
// const pythonInterpreterPath = path.join(
//   app.getAppPath(),
//   "./.venv/Scripts/python.exe"
// );

// Correct Python script path
// Correct script path for development & production
const pythonScriptPath = isDev()
  ? path.join(app.getAppPath(), "./src/python/HeyVox.py") // Development
  : path.join(process.resourcesPath, "python/HeyVox.py"); // Production

// Correct Python interpreter path (Windows & macOS/Linux)
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

export function createWakeUpProcess() {
  console.log("From wakeUp", os.platform());
  console.log(pythonInterpreterPath);
  console.log(pythonScriptPath);
  console.log("process started");
  const process = spawn(pythonInterpreterPath, [pythonScriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  return {
    process,
    pause: () => {
      console.log("pausing");
      process.stdin.write("pause\n");
    },
    resume: () => process.stdin.write("resume\n"),
    kill: () => process.kill(),
  };
}
