import { BrowserWindow } from "electron";
import { screen } from "electron";

export async function slideIn(overlayWindow: BrowserWindow) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let currentX = width;
  const targetX = width - 450;

  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (currentX > targetX) {
        currentX -= 10;
        overlayWindow.setBounds({ x: currentX, y: 0, width: 450, height });
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 2);
  });
}

export async function slideOut(overlayWindow: BrowserWindow) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let currentX = width - 450;
  const targetX = width;

  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (currentX < targetX) {
        currentX += 10;
        overlayWindow.setBounds({ x: currentX, y: 0, width: 450, height });
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 2);
  });
}
