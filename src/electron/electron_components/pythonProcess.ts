import { spawn } from 'child_process';
import path from 'path';
import { app } from 'electron';

const pythonScriptPath = path.join(app.getAppPath(), './src/python/HeyVox.py');
const pythonInterpreterPath = path.join(
  app.getAppPath(),
  './.venv/Scripts/python.exe'
);

export function createPythonProcess() {
  console.log("process started"); 
  const process = spawn(pythonInterpreterPath, [pythonScriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  return {
    process,
    pause: () => {
      console.log("pausing");
      process.stdin.write('pause\n')
    },
    resume: () => process.stdin.write('resume\n'),
    kill: () => process.kill(),
  };
}