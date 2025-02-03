import { Tray, Menu, app } from 'electron';
import { setQuitting } from '../main.js';


export function createTray(iconPath: string, mainWindow: Electron.BrowserWindow) {
  const tray = new Tray(iconPath);
  tray.setToolTip('My Electron App');

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => mainWindow.show(),
    },
    {
      label: 'Quit',
      click: () => {
        setQuitting(true);
        app.quit();
   
      },
    },
  ]);

  tray.setContextMenu(trayMenu);
  tray.on('double-click', () => mainWindow.show());

  return tray;
}