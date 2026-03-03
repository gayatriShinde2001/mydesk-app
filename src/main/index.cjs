const { app } = require('electron');
const WindowManager = require('./WindowManager.cjs');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = WindowManager.win;
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    console.log('app is ready')
    WindowManager.initialize(app);
    WindowManager.createWindow();
  });

  app.on('activate', () => {
    if (WindowManager.win === null) {
      WindowManager.createWindow();
    }
  });
}