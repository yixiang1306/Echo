import { spawn } from "child_process";
import path from "path";
import { app } from "electron";
import os from "node:os";
import { isDev } from "../util.js";

export function createWakeUpProcess() {
  // Correct Python script path
  const pythonScriptPath = isDev()
    ? path.join(app.getAppPath(), "src/python/HeyVox.py") // Development
    : path.join(process.resourcesPath, "python/HeyVox.py"); // Production

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
  console.log("Wake Up process started");
  const processWakeup = spawn(pythonInterpreterPath, [pythonScriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  return {
    process: processWakeup,
    pause: () => {
      console.log("pausing");
      processWakeup.stdin.write("pause\n");
    },
    resume: () => {
      console.log("resuming");
      processWakeup.stdin.write("resume\n");
    },
    kill: () => {
      processWakeup.kill();
      console.log("WakeUp process killed");
    },
  };
}
