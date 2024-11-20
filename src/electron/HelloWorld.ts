import { BrowserWindow } from "electron";

export function Hello(mainWindow: BrowserWindow){
    const hello ="hello";

    // Send a simple message after the window is ready
    mainWindow.webContents.once("did-finish-load", () => {
        mainWindow.webContents.send("title", "Hello, World!");
    });

}