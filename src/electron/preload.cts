const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electron", {
    // Send a message to show the main window
    showMainWindow: () => ipcRenderer.send('show-main-window'),

    // Listen for the 'title' message from the main process
    getHelloWorld: (callback: (message: string) => void) => {
        ipcRenderer.on("title", (event, message) => {
            callback(message); // Pass the message to the provided callback
        });
    },

    // Example static method (can be removed if unnecessary)
    getStaticData: () => {
        console.log('Static data method invoked.');
    },
});
