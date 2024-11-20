import {app, BrowserWindow} from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { Hello } from './HelloWorld.js';
import { getPreloadPath } from './pathResolver.js';



type test  = string; 

app.on('ready', () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload:getPreloadPath()
        },
    });

    if(isDev()){
        mainWindow.loadURL("http:localhost:3000");
    }else{
        mainWindow.loadFile(path.join(app.getAppPath()+'/dist-react/index.html'));
    }

    Hello(mainWindow);

    
});
  