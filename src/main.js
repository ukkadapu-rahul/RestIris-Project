const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;
let tray;
let isQuitting = false;

// Function to play custom notification sound
function playCustomNotificationSound() {
  try {
    const audioPath = path.join(__dirname, '../assets/ding.wav');
    
    // Check if the audio file exists
    if (!fs.existsSync(audioPath)) {
      console.warn('Custom notification sound file not found:', audioPath);
      return;
    }

    // Use shell to play the audio file (works on Windows)
    if (process.platform === 'win32') {
      // Use PowerShell with System.Media.SoundPlayer for WAV files
      const escapedPath = audioPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      exec(`powershell -c "(New-Object Media.SoundPlayer '${escapedPath}').PlaySync()"`, (error) => {
        if (error) {
          console.error('Error playing custom notification sound:', error);
          // Fallback: use system notification sound by not setting silent: true
          console.log('Falling back to system notification sound');
        }
      });
    } else {
      // For other platforms, use shell.openExternal as fallback
      shell.openExternal(`file://${audioPath}`);
    }
  } catch (error) {
    console.error('Error setting up custom notification sound:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 200,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    skipTaskbar: false,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
 // mainWindow.webContents.openDevTools(); // TEMP: See any renderer errors

  mainWindow.on('minimize', (event) => {
    // Hide window from taskbar and show in system tray
    event.preventDefault();
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);
    console.log('Minimize event: window hidden, moved to system tray');
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      // Actually quit the app when close button is clicked
      console.log('Close event: quitting app');
      // No preventDefault - let the app quit
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const trayIconPath = path.resolve(__dirname, '../assets/icon-tray.png');
  const image = fs.existsSync(trayIconPath)
    ? nativeImage.createFromPath(trayIconPath)
    : nativeImage.createEmpty();

  tray = new Tray(image);

  tray.setToolTip('20-20-20 Eye Strain Timer');
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow?.show();
        mainWindow?.setSkipTaskbar(false);
        mainWindow?.focus();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]));

  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.setSkipTaskbar(false);
    mainWindow?.focus();
  });
}

ipcMain.on('minimize-window', () => {
  console.log('🔽 Minimize button clicked');
  console.log('Main process: minimize-window IPC received');

  if (mainWindow) {
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);
    console.log('Main process: Window hidden, moved to system tray');
  }
});

ipcMain.on('close-window', () => {
  console.log('❌ Close button clicked');
  if (mainWindow) {
    // Actually quit the app when close button is clicked
    isQuitting = true;
    app.quit();
    console.log('Main process: App quitting');
  }
});

ipcMain.on('restore-window', () => {
  console.log('🔁 restore-window IPC received');
  console.log('Main process: restore-window IPC received');
  
  if (mainWindow) {
    mainWindow.setSkipTaskbar(false);
    mainWindow.show();
    mainWindow.focus();
    console.log('Main process: mainWindow.show() called');
  }
});

ipcMain.on('show-notification', (_, title, body) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      icon: path.join(__dirname, '../assets/icon.png'),
      silent: true // Disable default notification sound
    });

    notification.show();

    // Play custom notification sound
    playCustomNotificationSound();

    notification.on('click', () => {
      mainWindow?.show();
      mainWindow?.setSkipTaskbar(false);
      mainWindow?.focus();
    });
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Stay running in tray
});

app.on('before-quit', () => {
  isQuitting = true;
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.setSkipTaskbar(false);
      mainWindow.focus();
    }
  });
}
