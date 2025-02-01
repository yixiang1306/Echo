import { app, globalShortcut } from 'electron';
import dotenv from 'dotenv';
import path from 'path';
import { createPythonProcess } from './electron_components/pythonProcess.js';
import { isDev } from './util.js';
import { createAudioWindow, createMainWindow, createOverlayWindow } from './electron_components/windows.js';
import { createTray } from './electron_components/tray.js';
import { setupIpcHandlers } from './electron_components/ipcHandlers.js';
import { slideIn, slideOut } from './electron_components/animations.js';


dotenv.config();

let mainWindow: Electron.BrowserWindow;
let overlayWindow: Electron.BrowserWindow;
let audioWindow: Electron.BrowserWindow;
let pythonProcess: ReturnType<typeof createPythonProcess>;
let isQuitting = false;

app.commandLine.appendSwitch('disable-features', 'ChunkedDataPipe');

app.on('ready', async () => {
  const iconPath = isDev()
    ? path.join(app.getAppPath(), 'public', 'askvoxIcon.ico')
    : path.join(process.resourcesPath, 'askvoxIcon.ico');

  // Create windows
  mainWindow = createMainWindow(iconPath);
  overlayWindow = createOverlayWindow(iconPath);
  audioWindow = createAudioWindow();

  // Setup Python process
  pythonProcess = createPythonProcess();

  // Setup tray
  createTray(iconPath, mainWindow);

  // Setup IPC handlers
  setupIpcHandlers(mainWindow, audioWindow);

  // Window event handlers
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Global shortcuts
  globalShortcut.register('Alt+V', () => handleOverlayToggle());
  globalShortcut.register('Alt+C', () => audioWindow.webContents.send('stop-audio'));

  // Python process communication
  pythonProcess.process.stdout.on('data', async(data: Buffer) => {
    console.log(data.toString().trim() === 'wake-up');
    if (data.toString().trim() === 'wake-up') {
      overlayWindow.show()
      await slideIn(overlayWindow);
    };
  });
});

// Cleanup before quit
app.on('before-quit', () => {
  pythonProcess.kill();
});


// Handle Alt+V
async function handleOverlayToggle() {
  console.log("Alt+V pressed.");
  if (overlayWindow.isVisible()) {
    await slideOut(overlayWindow);
    overlayWindow.hide();
    console.log("hide overlay");
    pythonProcess.resume();
  } else {
    overlayWindow.show();
    console.log("show overlay");
    await slideIn(overlayWindow);
    pythonProcess.pause();
  }
}