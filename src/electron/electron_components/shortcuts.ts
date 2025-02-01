import { globalShortcut } from "electron";

export function registerShortcuts(overlayWindow: Electron.BrowserWindow, audioWindow: Electron.BrowserWindow) {
  globalShortcut.register("Alt+V", () => {
    if (overlayWindow?.isVisible()) {
      overlayWindow.hide();
    } else {
      overlayWindow?.show();
    }
  });

  globalShortcut.register("Alt+C", () => {
    audioWindow?.webContents.send("stop-audio");
  });
}
