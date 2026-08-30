const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('robotPapers', {
  getAiConfig: () => ipcRenderer.invoke('robot-papers:get-ai-config'),
  saveAiConfig: (config) => ipcRenderer.invoke('robot-papers:save-ai-config', config),
  testAiConnection: (config) => ipcRenderer.invoke('robot-papers:test-ai-connection', config),
  generateAi: (payload) => ipcRenderer.invoke('robot-papers:generate-ai', payload),
  saveAiDocument: (payload) => ipcRenderer.invoke('robot-papers:save-ai-document', payload),
  onLibraryUpdated: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('robot-papers:library-updated', listener);
    return () => ipcRenderer.removeListener('robot-papers:library-updated', listener);
  },
});
