import { spawn } from 'child_process';
import path from 'path';
import { app } from 'electron';

const pythonScriptPath = path.join(app.getAppPath(), './src/python/LLM.py');
const pythonInterpreterPath = path.join(
  app.getAppPath(),
  './.venv/Scripts/python.exe'
);

export function createLLMProcess() {
  console.log("process started"); 
  const process = spawn(pythonInterpreterPath, [pythonScriptPath]);

  return {
    process,
    kill: () => process.kill(),
  };
}
