import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { isDev } from './util.js';
import { Hello } from './HelloWorld.js';
import { getPreloadPath } from './pathResolver.js';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false; // Track whether the app is being quit explicitly

// Path to the Python script and interpreter in the virtual environment
const pythonScriptPath = path.join(app.getAppPath(), './src/python/HeyVox.py');
const pythonInterpreterPath = path.join(app.getAppPath(), './.venv/Scripts/python.exe'); // Adjust for Windows: ../python/venv/Scripts/python
let pythonProcess: any = null;

app.on('ready', () => {
  const iconPath = path.join(app.getAppPath(), 'dist-react', 'icon.jpg'); // Path to tray icon

  app.commandLine.appendSwitch('disable-features', 'ChunkedDataPipe');

  // Create the main window
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  // Load React/Vite app
  if (isDev()) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist-react', 'index.html'));
  }

  // Prevent app from quitting when window is closed
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide(); // Hide the window instead of quitting
    }
  });

  // Create the tray icon
  tray = new Tray(iconPath);
  tray.setToolTip('My Electron App'); // Tooltip for the tray icon

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show(); // Show the app window
      },
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true; // Explicitly allow quitting
        app.quit(); // Quit the application
      },
    },
  ]);

  tray.setContextMenu(trayMenu);

  // Restore app window on tray icon double-click
  tray.on('double-click', () => {
    mainWindow?.show();
  });

  Hello(mainWindow);

  // Spawn the Python process
  pythonProcess = spawn(pythonInterpreterPath, [pythonScriptPath]);

  // Listen for messages from Python
  pythonProcess.stdout.on('data', (data: Buffer) => {
    const message = data.toString().trim();
    console.log('Message from Python:', message);

    if (message === 'wake-up') {
      mainWindow?.show(); // Wake up the Electron window
    }
  });

  // Handle Python errors
  pythonProcess.stderr.on('data', (data: Buffer) => {
    console.error('Error from Python:', data.toString());
  });

  pythonProcess.on('close', (code: number) => {
    console.log(`Python process exited with code ${code}`);
  });
});

// Handle when all windows are closed
//@ts-ignore
app.on('window-all-closed', (event) => {
  if (!isQuitting) {
    event.preventDefault();
  }
});

// Clean up resources before quitting
app.on('before-quit', () => {
  tray?.destroy();
  if (pythonProcess) {
    pythonProcess.kill(); // Ensure the Python process is terminated
  }
});

// Handle IPC to show the main window
ipcMain.on('show-main-window', () => {
  mainWindow?.show();
});
