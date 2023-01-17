const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('data', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  upcoming: () => ipcRenderer.invoke('upcoming'),
  vacationsToday: () => ipcRenderer.invoke('vacationsToday'),
  dataUpdated: (message) => {
    ipcRenderer.on('dataUpdated', message);
  }
})