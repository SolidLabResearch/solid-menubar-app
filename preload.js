const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  upcoming: () => ipcRenderer.invoke('upcoming'),
  vacationsToday: () => ipcRenderer.invoke('vacationsToday')
})