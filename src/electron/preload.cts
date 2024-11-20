const electron = require('electron');


electron.contextBridge.exposeInMainWorld("electron",{
    // Expose a method to listen for 'title' messages
    getHelloWorld: (callback: any) => {
        electron.ipcRenderer.on("title", (event, message) => {
            callback(message); // Pass the message to the callback
        });
    },
    getStaticData:()=> console.log('static'),
})