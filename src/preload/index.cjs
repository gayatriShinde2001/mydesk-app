const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Notes
  loadNotes: () => ipcRenderer.invoke('load-notes'),
  addNote: (note) => ipcRenderer.invoke('add-note', note),
  deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
  deleteAllNotes: () => ipcRenderer.invoke('delete-all-notes'),
  requestCloseNotes: (title, content) => ipcRenderer.invoke('request-close-notes', title, content),
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  saveFile: () => ipcRenderer.invoke('save-file-dialog'),

  // Tasks
  loadTasks: () => ipcRenderer.invoke('load-tasks'),
  addTask: (task) => ipcRenderer.invoke('add-task', task),
  editTask: (task) => ipcRenderer.invoke('edit-task', task),
  deleteTask: (taskId) => ipcRenderer.invoke('delete-task', taskId),
  deleteAllTasks: () => ipcRenderer.invoke('delete-all-tasks'),
  updateTaskStatus: (taskId, status) => ipcRenderer.invoke('update-task-status', taskId, status),
  filterTasks: (searchTerm) => ipcRenderer.invoke('filter-tasks', searchTerm),
  requestCloseTasks: (isModalOpen) => ipcRenderer.invoke('request-close-tasks', isModalOpen),

  // Context menu
  showTaskContextMenu: (task) => ipcRenderer.invoke('show-task-context-menu', task),

  // Event listeners with cleanup
  onCloseRequest: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('app-close-request', subscription);
    return () => ipcRenderer.removeListener('app-close-request', subscription);
  },

  removeAllCloseListeners: () => ipcRenderer.removeAllListeners('app-close-request'),

  onStatusUpdate: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('status-update', listener);
    return () => ipcRenderer.removeListener('status-update', listener);
  },

  openAppListener: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('open-app', listener);
    return () => ipcRenderer.removeListener('open-app', listener);
  },

  reloadTasksListener: (callback) => {
    ipcRenderer.on('refresh-tasks', callback);
    return () => ipcRenderer.removeListener('refresh-tasks', callback);
  },

  reloadNotesListener: (callback) => {
    ipcRenderer.on('refresh-notes', callback);
    return () => ipcRenderer.removeListener('refresh-notes', callback);
  },

  onImportNotes: (callback) => {
    ipcRenderer.on('import-notes', callback);
    return () => ipcRenderer.removeListener('import-notes', callback);
  },

  onExportNotes: (callback) => {
    ipcRenderer.on('export-notes', callback);
    return () => ipcRenderer.removeListener('export-notes', callback);
  }
});
