const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body)
});
