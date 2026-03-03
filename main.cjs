const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cron = require('node-cron');


const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) {
        win.restore();
        win.show();
      }
      win.focus();
    }
  })
}

let notesFilePath;
let tasksFilePath;
let backupDir;
let notes = [];
let isReadyToClose = false;
let tray = null;
let win = null;
let isDialogOpen = false;


const checkOverdueTasks = () => {
  console.log('in checkOverdueTasks')
  if (!fs.existsSync(notesFilePath)) return;
  const now = new Date();
  const allTasks = fs.readFileSync(tasksFilePath, 'utf-8');
  const overDueTasks = [];
  const allTasksJson = JSON.parse(allTasks);
  allTasksJson.forEach((task) => {
    if (task.remindAt && !task.isOverdue) {
      const remindTime = new Date(task.remindAt);
      if (remindTime <= now) {
        task.isOverdue = true;
        overDueTasks.push(task);
      }
    }
  });
  fs.writeFileSync(tasksFilePath, JSON.stringify(allTasksJson, null, 2));
  showOverdueTasks(overDueTasks);
  console.log(`Found ${overDueTasks.length} overdue task(s)`);
  if (overDueTasks.length > 0) {
    updateTrayTooltip(overDueTasks.length)
    updateContextMenu({ overDueTaskCount: overDueTasks.length });
    sendTasksRefreshEvent();
  }
  tasks = allTasksJson;
}

const showOverdueTasks = (overDueTask) => {
  overDueTask.forEach((overdueTask) => {
    console.log("overdueTask", overdueTask)
    const notification = new Notification({ title: overdueTask.name, body: overdueTask.description, timeoutType: 'default' })
    notification.on('click', () => {
      console.log('clicked on notification');
      win.show();
      win.webContents.send('open-app', {
        tab: 'tasks'
      });
      sendTasksRefreshEvent();
    })
    notification.show();
  })
}

const updateTrayTooltip = (overdueCount) => {
  if (!tray) return;
  const tooltipText = overdueCount > 0
    ? `MyDesk App - ${overdueCount} overdue task(s)`
    : 'MyDesk App';
  tray.setToolTip(tooltipText);
}

const updateContextMenu = (data = {}) => {
  const { overDueTaskCount = 0 } = data;
  const defaultFirstItems = [
    {
      label: 'Show App', click: () => {
        win.show();
        sendTasksRefreshEvent();
      }
    },
    { label: 'Hide App', click: () => win.hide() },
    { type: 'separator' },

  ]

  const optionalMenuItems = [
    ...(overDueTaskCount > 0 ? [
      {
        label: 'View Overdue Tasks',
        click: () => {
          win.show();
          win.webContents.send('open-app', {
            tab: 'tasks'
          })
          sendTasksRefreshEvent();
          updateContextMenu()
        }
      },
      { type: 'separator' },
    ] : [])
  ]

  const defaultLastItems = [
    {
      label: 'Quit', click: () => {
        isReadyToClose = true;
        app.quit();
        tray.destroy();
      }
    }
  ]
  const finalContextMenu = Menu.buildFromTemplate([
    ...defaultFirstItems,
    ...optionalMenuItems,
    ...defaultLastItems
  ]);
  tray.setContextMenu(finalContextMenu);
}

cron.schedule('* * * * *', checkOverdueTasks);
cron.schedule('0 0 * * *', createBackup);

ipcMain.handle('add-note', async (event, note) => {
  const newNote = {
    id: crypto.randomUUID(),
    title: note.title,
    content: note.content
  };
  notes.push(newNote);
  fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
  sendNotesRefreshEvent();
  return { success: true, data: notes };
});

ipcMain.handle('delete-note', async (event, noteId) => {
  console.log('in delete-note')
  if (isDialogOpen) return { success: false, cancelled: true }
  isDialogOpen = true;
  try {
    const result = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Delete', 'Cancel'],
      defaultId: 1,
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this Note?',
      detail: 'This action cannot be undone!'
    })

    if (result.response === 0) {
      notes = notes.filter(n => n.id !== noteId);
      fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
      sendNotesRefreshEvent();
      return { success: true };
    }
    else {
      return { success: false, cancelled: true };
    }
  } finally {
    isDialogOpen = false;
  }
});

ipcMain.handle('delete-all-notes', async () => {
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Delete All', 'Cancel'],
    defaultId: 1,
    title: 'Confirm Delete All',
    message: 'Are you sure you want to delete all notes?',
    detail: 'This action cannot be undone!'
  });

  if (result.response === 0) {
    notes = [];
    fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
    return { success: true, data: notes };
  }
  return { success: false, cancelled: true };
});

ipcMain.handle('load-notes', async () => {
  try {
    if (!fs.existsSync(notesFilePath))
      return { success: true, data: [] }
    const data = fs.readFileSync(notesFilePath, 'utf-8');
    const notesArr = JSON.parse(data);
    notes = notesArr
    return { success: true, data: notesArr }
  } catch (e) {
    return {
      success: false,
      error: e.message
    }
  }
});

ipcMain.handle('request-close-notes', async (event, title, content) => {
  const hasTitle = title?.trim().length > 0;
  const hasContent = content?.trim().length > 0;
  const hasBoth = hasTitle && hasContent;
  const hasOne = !hasBoth && (hasTitle || hasContent);

  if (!hasOne && !hasBoth) {
    isReadyToClose = true;
    win.hide();
    return;
  }

  let result;
  if (hasBoth) {
    result = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 2,
      title: 'Unsaved Changes',
      message: 'Do you want to save changes before closing?',
      detail: 'You have unsaved notes with both title and content.'
    });
  } else {
    result = await dialog.showMessageBox({
      type: 'warning',
      buttons: ['OK', 'Cancel'],
      defaultId: 1,
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Exit anyway?'
    });
  }

  if (hasBoth && result.response === 0) {
    const newNote = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim()
    };
    notes.push(newNote);
    fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
  } else if ((hasOne && result.response === 1) || (hasBoth && result.response === 2)) {
    win.show();
    return;
  }
  isReadyToClose = true;
  win.hide();
});

ipcMain.handle('request-close-tasks', async (event, isModalOpen) => {
  if (isModalOpen) {
    win.show();
    return;
  };
  win.hide();
});

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ extensions: 'json' }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const data = fs.readFileSync(result.filePaths[0], 'utf-8');
    const parsedData = JSON.parse(JSON.parse(JSON.stringify(data)));
    parsedData.forEach((note) => {
      const newNote = {
        id: crypto.randomUUID(),
        title: note.title,
        content: note.content
      }
      notes.push(newNote);
    });
    console.log('notesFilePath', notesFilePath)
    fs.writeFileSync(notesFilePath, JSON.stringify(notes, null, 2));
    sendNotesRefreshEvent();
    return { success: true, data: notes }
  }
  return { success: false, cancelled: true }
})

ipcMain.handle('save-file-dialog', async () => {
  const result = await dialog.showSaveDialog({
    defaultPath: 'notes-export.json',
    filters: [{ name: 'JSON Files', extensions: 'json' }]
  });
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(notes, null, 2));
    return { success: true };
  }
  return { success: false, cancelled: true }
})

let tasks = [];

ipcMain.handle('load-tasks', async () => {
  console.log('loading tasks')
  try {
    if (!fs.existsSync(tasksFilePath))
      return { success: true, data: [] }
    const data = fs.readFileSync(tasksFilePath, 'utf-8');
    const tasksArr = JSON.parse(data);
    tasks = tasksArr;
    return { success: true, data: tasksArr }
  } catch (e) {
    return { success: false, error: e.message }
  }
});

ipcMain.handle('add-task', async (event, task) => {
  const isOverdue = task.remindAt ? new Date(task.remindAt) < new Date() : false;
  const newTask = {
    id: crypto.randomUUID(),
    name: task.name,
    description: task.description,
    remindAt: task.remindAt,
    status: 'todo',
    isOverdue
  };
  tasks.push(newTask);
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
  return { success: true, data: tasks };
});

ipcMain.handle('delete-task', async (event, taskId) => {
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this Task?',
    detail: 'This action cannot be undone!'
  });

  if (result.response === 0) {
    tasks = tasks.filter(t => t.id !== taskId);
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
    sendTasksRefreshEvent()
    return { success: true };
  } else {
    return { success: false, cancelled: true };
  }
});

ipcMain.handle('delete-all-tasks', async () => {
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Delete All', 'Cancel'],
    defaultId: 1,
    title: 'Confirm Delete All Tasks',
    message: 'Are you sure you want to delete all tasks?',
    detail: 'This action cannot be undone!'
  });

  if (result.response === 0) {
    tasks = [];
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
    return { success: true, data: tasks };
  } else {
    return { success: false, cancelled: true };
  }
});

ipcMain.handle('filter-tasks', async (event, searchTerm) => {
  try {
    const filtered = tasks.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { success: true, data: filtered };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('update-task-status', async (event, taskId, newStatus) => {
  try {
    updateTaskStatus(taskId, newStatus);
    return { success: true, data: tasks };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('show-task-context-menu', async (event, task) => {
  console.log(task)
  const taskId = task.id;
  const currentStatus = task.status;
  const validStatusesTemplates = [];
  taskStatesAndContextHandlers.forEach((status) => {
    if (status.key === currentStatus) return;
    const clickHandler = status.getClickHandler(taskId);
    validStatusesTemplates.push({
      label: status.label,
      click: clickHandler
    });
  });
  const menu = Menu.buildFromTemplate(validStatusesTemplates);
  menu.popup({ window: win })

})
function createTray() {
  let iconPath;
  if (app.isPackaged) {
    iconPath = path.join(process.resourcesPath, 'icon.png');
  } else {
    iconPath = path.join(app.getAppPath(), 'icon.png');
  }
  console.log("iconPath:", iconPath);

  // Try reading as buffer
  let icon;
  try {
    const buffer = fs.readFileSync(iconPath);
    console.log("Buffer length:", buffer.length);
    icon = nativeImage.createFromBuffer(buffer);
    console.log("Icon from buffer - isEmpty:", icon.isEmpty());
    console.log("Icon from buffer - size:", icon.getSize());
  } catch (e) {
    console.error("Error reading buffer:", e);
  }

  // Fallback to createFromPath
  if (!icon || icon.isEmpty()) {
    console.log("Trying createFromPath...");
    icon = nativeImage.createFromPath(iconPath);
  }

  if (icon.isEmpty()) {
    console.error("Icon is empty, cannot create tray");
    return;
  }

  try {
    console.log("Creating tray...");
    tray = new Tray(icon);
    console.log("Tray created, cheking for overdue tasks to set the tooltip...");
    checkOverdueTasks()
    console.log("Tooltip set, building menu...");

  } catch (error) {
    console.error("Error creating tray:", error);
    return;
  }
  updateContextMenu();


  tray.on('click', () => { win.show(); sendTasksRefreshEvent() });

  console.log("Tray setup complete. Tray object:", tray ? "exists" : "null");
}

const sendTasksRefreshEvent = () => {
  win.webContents.send('refresh-tasks');
}

const sendNotesRefreshEvent = () => {
  setTimeout(() => {
    win.webContents.send('refresh-notes');
  }, 100)
}

const updateTaskStatus = (taskId, newStatus) => {
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  console.log('taskId', taskId)
  if (taskIndex === -1) {
    return { success: false, error: 'Task not found' };
  }
  tasks[taskIndex].status = newStatus;
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
}

const createApplicationMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Import Notes',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: async () => { await win.webContents.send('import-notes'); }
        },
        {
          label: 'Export Notes',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => win.webContents.send('export-notes')
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isReadyToClose = true;
            tray.destroy();
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => { win.webContents.reload(); }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            win.webContents.session.clearCache();
            win.webContents.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => { win.webContents.toggleDevTools(); }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}


function createWindow() {
  const userDataPath = app.getPath('userData');
  // can be stored in database instead of json files
  // it will help in tasks like filterig, searching and pagination
  notesFilePath = path.join(userDataPath, 'notes.json');
  tasksFilePath = path.join(userDataPath, 'tasks.json');
  backupDir = path.join(userDataPath, 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  win = new BrowserWindow({
    width: 900,
    height: 700,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(app.getAppPath(), 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true
    }
  });

  createTray();
  createApplicationMenu();

  win.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      win.webContents.send('status-update', {
        isReady: true,
        timestamp: new Date().toLocaleTimeString()
      })
    }, 2000)
  })

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    // This will fire if page load fails
    console.error('Failed to load:', errorCode, errorDescription);
  });

  win.webContents.on('render-process-gone', (event, details) => {
    // This will be fired if render process is crashed or killed
    console.error('Render process gone:', details);
  });

  win.on('close', (e) => {
    if (!isReadyToClose) {
      e.preventDefault();
      win.webContents.send('app-close-request');
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
  console.log('Notifications.isSupported', Notification.isSupported())
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (fs.existsSync(notesFilePath)) {
    const backupPath = path.join(backupDir, `notes.${timestamp}.json`);
    fs.copyFileSync(notesFilePath, backupPath);
  }

  if (fs.existsSync(tasksFilePath)) {
    const backupPath = path.join(backupDir, `tasks.${timestamp}.json`);
    fs.copyFileSync(tasksFilePath, backupPath);
  }

  cleanupOldBackups();

  console.log('Backup created:', timestamp);
}

function cleanupOldBackups() {
  const files = fs.readdirSync(backupDir);
  const notesBackups = files.filter(f => f.startsWith('notes.')).sort().reverse();
  const tasksBackups = files.filter(f => f.startsWith('tasks.')).sort().reverse();

  notesBackups.slice(5).forEach(f => fs.unlinkSync(path.join(backupDir, f)));
  tasksBackups.slice(5).forEach(f => fs.unlinkSync(path.join(backupDir, f)));
}

const taskStatesAndContextHandlers = [
  {
    key: 'todo',
    label: 'Move to To Do',
    getClickHandler: (taskId) => {
      return () => {
        updateTaskStatus(taskId, 'todo');
        sendTasksRefreshEvent();
      }
    }
  },
  {
    key: 'inprogress',
    label: 'Move to In Progress',
    getClickHandler: (taskId) => {
      return () => {
        console.log('updating to inprogress')
        updateTaskStatus(taskId, 'inprogress');
        sendTasksRefreshEvent();
      }
    }
  },
  {
    key: 'done',
    label: 'Move to Done',
    getClickHandler: (taskId) => {
      return () => {
        updateTaskStatus(taskId, 'done');
        sendTasksRefreshEvent();
      }
    }
  }
];

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});