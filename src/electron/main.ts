import { spawn } from 'child_process';
import { app, BrowserWindow, ipcMain, Menu, Tray,screen, globalShortcut } from 'electron';
import path from 'path';
import { getPreloadPath } from './pathResolver.js';
import { isDev } from './util.js';
import axios from 'axios';
import sound from 'sound-play';
import { writeFileSync } from 'fs';


let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false; // Track whether the app is being quit explicitly

// Path to the Python script and interpreter in the virtual environment
const pythonScriptPath = path.join(app.getAppPath(), './src/python/HeyVox.py');
const pythonInterpreterPath = path.join(app.getAppPath(), './.venv/Scripts/python.exe'); // Adjust for Windows: ../python/venv/Scripts/python
let pythonProcess: any = null;

app.on('ready', async() => {

  const iconPath = !isDev() ? path.join(app.getAppPath(), 'dist-react', 'askvoxIcon.ico') : path.join(app.getAppPath(), 'public', 'askvoxIcon.ico');

  app.commandLine.appendSwitch('disable-features', 'ChunkedDataPipe');

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;


  //----------------------------ELECTRON WINDOW SETUP----------------------------

  // Create the main window
  mainWindow = new BrowserWindow({
    width: 800,         // Initial window width
    height: 600,        // Initial window height
    minWidth: 800,      // Minimum window width (absolute size)
    minHeight: 600,     // Minimum window height (absolute size)
    icon:iconPath,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true, // Ensure context isolation is enabled
    nodeIntegration: false,
    },
  });

  // Create the overlay window
  overlayWindow = new BrowserWindow({
    icon:iconPath,
    width: 450,
    height: height,
    frame: false,
    x: width, // Start off-screen to the right
    y: 0, // Adjust Y position if needed
    alwaysOnTop: true, // Keep the window on top
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true, // Ensure context isolation is enabled
    nodeIntegration: false,
    },
  });


  //-------------------------ENVIRONMENTAL PATHS-------------------------
  // Load React/Vite app
  if (isDev()) {
    mainWindow.loadURL('http://localhost:3000');
    overlayWindow.loadURL('http://localhost:3000/overlay');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist-react', 'index.html'));
    //need to build overlay page
    //overlayWindow.loadFile(path.join(app.getAppPath(), 'dist-react', 'overlay.html'));
  }

  //-------------------MAIN WINDOW EVENT HANDLERS---------------------

  // Prevent app from quitting when window is closed
  mainWindow.on('close', async(event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide(); // Hide the window instead of quitting
    }
  });


  //-------------------------OVERLAY WINDOW EVENT HANDLERS---------------------

  // Custom hide function with animation
  async function customHide() {
    if (overlayWindow?.isVisible()) {
      console.log('Hiding window with animation...');
  
      // Get the initial position of the window
      const { x, y } = overlayWindow.getBounds();
      console.log(`Window position before hiding: x=${x}, y=${y}`);
  
      // Wait for the slide-out animation to finish
      await slideOut();
  
      // Hide the window
      overlayWindow.hide();
      console.log('Window hidden.');
    }
  }
  
  // Register a global shortcut for Alt+V
  globalShortcut.register('Alt+V', () => {
    if (overlayWindow) {
      if (overlayWindow.isVisible()) {
        console.log('Alt+V pressed. Hiding the window...');
        customHide(); // Hide the window
      } else {
        console.log('Alt+V pressed. Showing the window...');
        
        overlayWindow.show(); // Show the window
      }
    }
  });

  // Handle showing the main window
  overlayWindow.on('show', async() => {
    pauseListening(); // Pause the Python process when the window is shown
    await slideIn();
  });

  // Handle hiding the main window
  overlayWindow.on('hide', async() => {
    resumeListening(); // Resume the Python process when the window is hidden
  });

//----------------------------SPAWN PYTHON PROCESS----------------------------

  // Spawn the Python process
  pythonProcess = spawn(pythonInterpreterPath, [pythonScriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'], // Enable communication with the Python process
  });
  // Listen for messages from Python
  pythonProcess.stdout.on('data', (data: Buffer) => {
    const message = data.toString().trim();
    console.log('Message from Python:', message);

    if (message === 'wake-up') {
      overlayWindow?.show(); // Wake up the Electron window
    }
  });
  // Log messages from Python's stderr
  pythonProcess.stderr.on('data', (data: Buffer) => {
    console.error('Python Log:', data.toString());
  });
  pythonProcess.on('close', (code: number) => {
    console.log(`Python process exited with code ${code}`);
  });

  //----------------------------TRAY ICON SETUP----------------------------
  // Create the tray icon
  tray = new Tray(iconPath);
  tray.setToolTip('My Electron App'); // Tooltip for the tray icon


  //tray icon
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
  tray.on('double-click', async() => {
    mainWindow?.show();
  });

});

// Pause Python listening
const pauseListening = () => {
  if (pythonProcess) {
    pythonProcess.stdin.write('pause\n'); // Send a "pause" command to the Python process
    console.log('Sent pause signal to Python process.');
  }
};

// Resume Python listening
const resumeListening = () => {
  if (pythonProcess) {
    pythonProcess.stdin.write('resume\n'); // Send a "resume" command to the Python process
    console.log('Sent resume signal to Python process.');
  }
};

// Function to play audio from Base64 string
const playAudio = (audioBase64: string) => {
  try {
    // Decode Base64 audio and save it to a temporary file
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const tempAudioPath = path.join(app.getPath('temp'), 'response_audio.mp3');
    writeFileSync(tempAudioPath, audioBuffer);

    // Play the audio file
    sound.play(tempAudioPath)
      .then(() => {
        console.log('Audio playback completed.');
      })
      .catch((err) => {
        console.error('Error during audio playback:', err);
      });
  } catch (error) {
    console.error('Error in playAudio:', error);
  }
};

// Handle IPC to toggle recording for google-text-to-speech
ipcMain.handle('text-input', async (_,text:string) => {
  console.log(text);

  try {
    // Send the text input to the Python server
    const response = await axios.post('http://localhost:8000/llm', {
      text: text, // Send the text input as JSON
    });

    // Log the response from the Python server
    console.log('Response from LLM:', response.data.llm_response);


    // Send the response text to the Python server for TTS
    const ttsResponse = await axios.post('http://localhost:8000/tts', { text: response.data.llm_response });
    const audioBase64 = ttsResponse.data.audio_base64;

    console.log('Playing audio for response...');
    playAudio(audioBase64); // Play the audio

    return response.data.llm_response;
  } catch (error) {
    console.error('Error communicating with the Python server:');
    return "Error communicating with the server. Pls Try Again :3";
  } 
});

ipcMain.handle("send-audio", async (_, audioData) => {
  try {

    console.log("Audio Data:", audioData.length);
    // Send audio to Speech-to-Text endpoint
    const sttResponse = await axios.post("http://localhost:8000/transcribe", {
      audio: audioData,
    });

    const transcription = sttResponse.data.transcription;
    console.log("Transcription:", transcription);


    return transcription;

  } catch (error) {
    console.error("Error processing audio:",error);
    return "Error processing your request. Please try again.";
  }
});

// Handle IPC to show the main window
ipcMain.on('show-main-window', () => {
  overlayWindow?.show();
  pauseListening();
});

//SLIDER
// Sliding Animations
const slideIn = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let currentX = width; // Start off-screen
  const targetX = width - 450; // Target position (visible on-screen)

  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (currentX > targetX) {
        currentX -= 10; // Adjust step for smoother animation
        overlayWindow?.setBounds({ x: currentX, y: 0, width: 450, height });
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 2); 
  });
}; 

const slideOut = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let currentX = width - 450; // Start on-screen
  const targetX = width; // Move completely off-screen

  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (currentX < targetX) {
        currentX += 10; // Adjust step for smoother animation
        overlayWindow?.setBounds({ x: currentX, y: 0, width: 450, height });
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 2); 
  });
};

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
    console.log("Python process terminated.");
  }
});

