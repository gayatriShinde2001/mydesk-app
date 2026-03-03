const { Menu } = require('electron');

class AppMenu {
  create(win, handlers) {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Import Notes',
            accelerator: 'CmdOrCtrl+Shift+I',
            click: () => handlers.onImportNotes?.()
          },
          {
            label: 'Export Notes',
            accelerator: 'CmdOrCtrl+Shift+E',
            click: () => handlers.onExportNotes?.()
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => handlers.onQuit?.()
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => win?.webContents.reload()
          },
          {
            label: 'Force Reload',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              win?.webContents.session.clearCache();
              win?.webContents.reload();
            }
          },
          { type: 'separator' },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'F12',
            click: () => win?.webContents.toggleDevTools()
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

module.exports = new AppMenu();
