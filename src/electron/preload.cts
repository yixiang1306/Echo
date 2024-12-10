const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  toggleRecording: (recording:boolean) => ipcRenderer.send('toggle-recording', recording),
  textInput: (text:string) => ipcRenderer.invoke('text-input', text),
})