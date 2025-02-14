import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { app } from "electron";
import { isDev } from "./util.js";

const isWindows = os.platform() === "win32";
const basePath = isDev() ? app.getAppPath() : process.resourcesPath;

// The directory where the virtual environment will be created.
const venvPath = path.join(basePath, "python_env");

// The path to the Python executable inside the virtual environment.
const venvPython = path.join(
  venvPath,
  isWindows ? "Scripts" : "bin",
  isWindows ? "python.exe" : "python"
);

// The embedded Python installer folder.
const pythonInstallerPath = path.join(basePath, "python_installer");

// Use the embedded Python binary. (Make sure to adjust the folder names if needed)
const pythonBinary = isWindows
  ? path.join(pythonInstallerPath, "python_windows", "python.exe")
  : path.join(pythonInstallerPath, "python-embed-linux", "bin", "python3");

// The requirements file path.
const requirementsPath = path.join(basePath, "python_requirement.txt");

export function setupPython(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if the `python_env` folder exists; if not, create it.
    if (!fs.existsSync(venvPath)) {
      console.log("`python_env` not found. Creating...");
      fs.mkdirSync(venvPath, { recursive: true });
    }

    // If the virtual environment's Python already exists, skip setup.
    if (fs.existsSync(venvPython)) {
      console.log("Virtual environment already exists. Skipping setup.");
      return resolve();
    }

    try {
      console.log("Creating virtual environment using virtualenv...");
      // Use virtualenv (instead of venv) because the embedded Python lacks the venv module.
      execSync(`"${pythonBinary}" -m virtualenv "${venvPath}"`, {
        stdio: "ignore",
      });

      console.log("Installing dependencies...");
      // virtualenv automatically installs pip, so we can upgrade it.
      execSync(`"${venvPython}" -m pip install --upgrade pip`, {
        stdio: "ignore",
      });
      // Install the required packages.
      execSync(`"${venvPython}" -m pip install -r "${requirementsPath}"`, {
        stdio: "ignore",
      });

      console.log("Python setup complete.");
      resolve();
    } catch (error) {
      console.error("Python setup failed:", error);
      reject(error);
    }
  });
}
