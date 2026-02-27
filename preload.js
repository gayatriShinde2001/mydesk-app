const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  loadNotes: () => ipcRenderer.invoke('load-notes'),
  addNote: (note) => ipcRenderer.invoke('add-note', note),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
  deleteAllNotes: () => ipcRenderer.invoke('delete-all-notes'),
  requestCloseNotes: (title, content) => ipcRenderer.invoke('request-close-notes', title, content),
  requestCloseTasks: (isModalOpen) => ipcRenderer.invoke('request-close-tasks', isModalOpen),
  onCloseRequest: (callback) => {
    const subscription = (_event) => callback();
    ipcRenderer.on('app-close-request', subscription);
    return () => ipcRenderer.removeListener('app-close-request', subscription);
  },
  removeAllCloseListeners: () => ipcRenderer.removeAllListeners('app-close-request'),
  onStatusUpdate: (callback => {
    const listener = (event,data) => callback(data);
    ipcRenderer.on('status-update',listener);
    return ()=>{
      ipcRenderer.removeListener('status-update',listener);
    }
  }),
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: () => ipcRenderer.invoke('save-file-dialog'),
  loadTasks: () => ipcRenderer.invoke('load-tasks'),
  addTask: (task) => ipcRenderer.invoke('add-task', task),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  deleteAllTasks: () => ipcRenderer.invoke('delete-all-tasks'),
  updateTaskStatus: (taskId, status) => ipcRenderer.invoke('update-task-status', taskId, status),
  filterTasks: (searchTerm) => ipcRenderer.invoke('filter-tasks', searchTerm),
  openAppListener : (callback) => {
    const listener = (event,data) => callback(data);
    ipcRenderer.on('open-app',listener);
    return ()=>{
      ipcRenderer.removeListener('open-app',listener);
    }
  }
});
