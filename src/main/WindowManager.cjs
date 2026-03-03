const { BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, dialog } = require('electron');
const path = require('path');
const cron = require('node-cron');
const NoteManager = require('./managers/NoteManager.cjs');
const TaskManager = require('./managers/TaskManager.cjs');
const AppMenu = require('./menu/AppMenu.cjs');
const StorageService = require('./services/StorageService.cjs');
const fs = require('fs')

class WindowManager {
  constructor() {
    this.win = null;
    this.tray = null;
    this.isReadyToClose = false;
    this.isDev = true;
  }

  initialize(app) {
    this.app = app;
    this.isDev = !app.isPackaged;

    StorageService.initialize(app.getPath('userData'));

    NoteManager.setRefreshCallback(() => this.sendNotesRefreshEvent());
    TaskManager.setRefreshCallback(() => this.sendTasksRefreshEvent());

    this.setupIpcHandlers();
    this.scheduleCronJobs();
  }

  createWindow() {
    const iconPath = this.app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(this.app.getAppPath(), 'icon.png');

    let icon;
    try {
      const buffer = fs.readFileSync(iconPath);
      icon = nativeImage.createFromBuffer(buffer);
      if (icon.isEmpty()) {
        icon = nativeImage.createFromPath(iconPath);
      }
    } catch (e) {
      console.error('Error loading icon:', e);
      return null;
    }

    this.win = new BrowserWindow({
      width: 900,
      height: 700,
      icon: iconPath,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        devTools: true
      }
    });

    this.createTray(icon);
    this.createAppMenu();

    this.win.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        this.win.webContents.send('status-update', { isReady: true });
      }, 2000);
    });

    this.win.on('close', (e) => {
      if (!this.isReadyToClose) {
        e.preventDefault();
        this.win.webContents.send('app-close-request');
      }
    });

    if (this.isDev) {
      this.win.loadURL('http://localhost:5173');
      this.win.webContents.openDevTools();
    } else {
      this.win.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    return this.win;
  }

  createTray(icon) {
    try {
      this.tray = new Tray(icon);
      this.tray.setToolTip('MyDesk App');

      this.tray.on('click', () => {
        this.win.show();
        this.sendTasksRefreshEvent();
      });

      this.updateTrayMenu();
    } catch (error) {
      console.error('Error creating tray:', error);
    }
  }

  updateTrayMenu(overdueCount = 0) {
    const menuItems = [
      {
        label: 'Show App',
        click: () => {
          this.win.show();
          this.sendTasksRefreshEvent();
        }
      },
      { label: 'Hide App', click: () => this.win.hide() },
      { type: 'separator' }
    ];

    if (overdueCount > 0) {
      menuItems.push(
        {
          label: 'View Overdue Tasks',
          click: () => {
            this.win.show();
            this.win.webContents.send('open-app', { tab: 'tasks' });
            this.sendTasksRefreshEvent();
          }
        },
        { type: 'separator' }
      );
    }

    menuItems.push({
      label: 'Quit',
      click: () => {
        this.isReadyToClose = true;
        this.app.quit();
      }
    });

    const contextMenu = Menu.buildFromTemplate(menuItems);
    this.tray?.setContextMenu(contextMenu);
  }

  createAppMenu() {
    AppMenu.create(this.win, {
      onImportNotes: () => this.win.webContents.send('import-notes'),
      onExportNotes: () => this.win.webContents.send('export-notes'),
      onQuit: () => {
        this.isReadyToClose = true;
        this.tray?.destroy();
        this.app.quit();
      }
    });
  }

  sendNotesRefreshEvent() {
    this.win?.webContents.send('refresh-notes');
  }

  sendTasksRefreshEvent() {
    this.win?.webContents.send('refresh-tasks');
  }

  showOverdueNotifications(tasks) {
    tasks.forEach(task => {
      const notification = new Notification({
        title: task.name,
        body: task.description,
        timeoutType: 'default'
      });

      notification.on('click', () => {
        this.win.show();
        this.win.webContents.send('open-app', { tab: 'tasks' });
        this.sendTasksRefreshEvent();
      });

      notification.show();
    });
  }

  checkOverdueTasks() {
    const overdueTasks = TaskManager.checkOverdue();
    this.updateTrayMenu(overdueTasks.length);

    console.log('Found', overdueTasks.length, 'Overdue tasks')
    if (overdueTasks.length > 0) {
      this.showOverdueNotifications(overdueTasks);
    }
  }

  scheduleCronJobs() {
    cron.schedule('* * * * *', () => this.checkOverdueTasks());
    cron.schedule('0 0 * * *', () => {
      NoteManager.createBackup();
      TaskManager.createBackup();
    });
  }

  setupIpcHandlers() {
    // Notes handlers
    ipcMain.handle('load-notes', () => { return NoteManager.load() });

    ipcMain.handle('add-note', (event, note) => NoteManager.add(note));

    ipcMain.handle('delete-note', async (event, noteId) => {
      const dialogResult = await dialog.showMessageBox(this.win, {
        type: 'warning',
        buttons: ['Delete', 'Cancel'],
        defaultId: 1,
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this Note?',
        detail: 'This action cannot be undone!'
      });

      if (dialogResult.response === 0) {
        return NoteManager.confirmDelete(noteId);
      }
      return NoteManager.cancelDelete();
    });

    ipcMain.handle('delete-all-notes', async () => {
      const result = await dialog.showMessageBox(this.win, {
        type: 'warning',
        buttons: ['Delete All', 'Cancel'],
        defaultId: 1,
        title: 'Confirm Delete All',
        message: 'Are you sure you want to delete all notes?'
      });

      if (result.response === 0) {
        return NoteManager.deleteAll();
      }
      return { success: false, cancelled: true };
    });

    ipcMain.handle('open-file-dialog', async () => {
      const result = await dialog.showOpenDialog(this.win, {
        properties: ['openFile'],
        filters: [{ extensions: ['json'] }]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const data = fs.readFileSync(result.filePaths[0], 'utf-8');
        const parsedData = JSON.parse(JSON.parse(JSON.stringify(data)));
        return NoteManager.import(parsedData);
      }
      return { success: false, cancelled: true };
    });

    ipcMain.handle('save-file-dialog', async () => {
      const result = await dialog.showSaveDialog(this.win, {
        defaultPath: 'notes-export.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, JSON.stringify(NoteManager.export(), null, 2));
        return { success: true };
      }
      return { success: false, cancelled: true };
    });

    ipcMain.handle('request-close-notes', async (event, title, content) => {
      const hasTitle = title?.trim().length > 0;
      const hasContent = content?.trim().length > 0;

      if (!hasTitle && !hasContent) {
        this.isReadyToClose = true;
        this.win.hide();
        return;
      }

      const result = await dialog.showMessageBox(this.win, {
        type: 'warning',
        buttons: hasTitle && hasContent ? ['Save', "Don't Save", 'Cancel'] : ['OK', 'Cancel'],
        defaultId: hasTitle && hasContent ? 2 : 1,
        title: 'Unsaved Changes',
        message: hasTitle && hasContent
          ? 'Do you want to save changes before closing?'
          : 'You have unsaved changes. Exit anyway?'
      });

      if (hasTitle && hasContent && result.response === 0) {
        NoteManager.add({ title: title.trim(), content: content.trim() });
      } else if (result.response === (hasTitle && hasContent ? 2 : 0)) {
        this.win.show();
        return;
      }

      this.isReadyToClose = true;
      this.win.hide();
    });

    // Tasks handlers
    ipcMain.handle('load-tasks', () => {
      return TaskManager.load()
    });

    ipcMain.handle('add-task', (event, task) => TaskManager.add(task));
    ipcMain.handle('edit-task', (event, task) => TaskManager.edit(task))

    ipcMain.handle('delete-task', async (event, taskId) => {
      const result = await dialog.showMessageBox(this.win, {
        type: 'warning',
        buttons: ['Delete', 'Cancel'],
        defaultId: 1,
        title: 'Confirm Deletion',
        message: 'Are you sure you want to delete this Task?',
        detail: 'This action cannot be undone!'
      });

      if (result.response === 0) {
        return TaskManager.delete(taskId);
      }
      return { success: false, cancelled: true };
    });

    ipcMain.handle('delete-all-tasks', async () => {
      const result = await dialog.showMessageBox(this.win, {
        type: 'warning',
        buttons: ['Delete All', 'Cancel'],
        defaultId: 1,
        title: 'Confirm Delete All',
        message: 'Are you sure you want to delete all tasks?'
      });

      if (result.response === 0) {
        return TaskManager.deleteAll();
      }
      return { success: false, cancelled: true };
    });

    ipcMain.handle('filter-tasks', (event, searchTerm) => TaskManager.filter(searchTerm));

    ipcMain.handle('update-task-status', (event, taskId, newStatus) =>
      TaskManager.updateStatus(taskId, newStatus));

    ipcMain.handle('request-close-tasks', async (event, isModalOpen) => {
      if (isModalOpen) {
        this.win.show();
        return;
      }
      this.win.hide();
    });

    // Context menu for tasks
    ipcMain.handle('show-task-context-menu', async (event, task) => {
      const menuItems = [];
      const statuses = [
        { key: 'todo', label: 'Move to To Do' },
        { key: 'inprogress', label: 'Move to In Progress' },
        { key: 'done', label: 'Move to Done' }
      ];

      statuses.forEach(status => {
        if (status.key !== task.status) {
          menuItems.push({
            label: status.label,
            click: () => {
              TaskManager.updateStatus(task.id, status.key);
              this.sendTasksRefreshEvent();
            }
          });
        }
      });

      menuItems.push({ type: 'separator' });
      menuItems.push({
        label: 'Delete',
        click: () => {
          TaskManager.delete(task.id);
          this.sendTasksRefreshEvent();
        }
      });

      const menu = Menu.buildFromTemplate(menuItems);
      menu.popup({ window: this.win });
    });
  }
}

module.exports = new WindowManager();
