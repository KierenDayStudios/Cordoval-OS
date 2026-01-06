import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { release } from 'node:os'
import { join } from 'node:path'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null

// ==================== AUTO-UPDATE CONFIGURATION ====================
// Configure auto-updater
autoUpdater.autoDownload = false // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true

// Auto-update event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...')
  if (win) win.webContents.send('update-status', { status: 'checking' })
})

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version)
  if (win) {
    win.webContents.send('update-status', {
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  }
})

autoUpdater.on('update-not-available', (info) => {
  console.log('Up to date:', info.version)
  if (win) win.webContents.send('update-status', { status: 'not-available' })
})

autoUpdater.on('download-progress', (progress) => {
  const logMessage = `Download speed: ${progress.bytesPerSecond} - Downloaded ${progress.percent}%`
  console.log(logMessage)
  if (win) {
    win.webContents.send('update-status', {
      status: 'downloading',
      percent: progress.percent
    })
  }
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version)
  if (win) {
    win.webContents.send('update-status', {
      status: 'downloaded',
      version: info.version
    })
  }
})

autoUpdater.on('error', (err) => {
  console.error('Update error:', err.message)
  if (win) {
    win.webContents.send('update-status', {
      status: 'error',
      message: err.message
    })
  }
})

// IPC handlers for update actions
ipcMain.handle('check-for-updates', async () => {
  try {
    return await autoUpdater.checkForUpdates()
  } catch (error) {
    console.error('Error checking for updates:', error)
    return null
  }
})

ipcMain.handle('download-update', async () => {
  try {
    return await autoUpdater.downloadUpdate()
  } catch (error) {
    console.error('Error downloading update:', error)
    return null
  }
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true)
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// ====================================================================

const createWindow = () => {
  // LOGGING TO CHECK IF THIS RUNS
  console.log("--- CORDOVAL OS BOOTING: APPLYING CONFIG ---");
  console.log(`App Version: ${app.getVersion()}`);

  // In development, load from dev server; in production load from built files
  const isDev = process.env.NODE_ENV === 'development'
  const url = isDev ? 'http://localhost:5173/' : new URL(join(__dirname, '../renderer/index.html'), 'file://').toString()

  win = new BrowserWindow({
    title: 'Cordoval OS',
    width: 1920,
    height: 1080,
    x: 0,
    y: 0,
    // --- FORCE FULLSCREEN & NO FRAME ---
    fullscreen: true,       
    frame: false,           // Removes the "Electron" bar
    autoHideMenuBar: true,  // Hides File/Edit menu
    kiosk: false,           // Set to false for now so you can Alt+Tab if stuck
    thickFrame: false,
    type: 'desktop',        // Helps windows treat it as a desktop background
    // -----------------------------------
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,     // <--- THIS IS REQUIRED FOR WEBSITES TO LOAD
      webSecurity: false    // Allows loading images from external URLs easily
    },
  })

  if (isDev) {
    win.loadURL(url)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Handle external links
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Check for updates when window is ready (only in production)
  win.webContents.on('did-finish-load', () => {
    if (!isDev) {
      console.log('Checking for updates on startup...')
      setTimeout(() => {
        autoUpdater.checkForUpdates()
      }, 3000) // Wait 3 seconds after startup
      
      // Check for updates every 4 hours
      setInterval(() => {
        autoUpdater.checkForUpdates()
      }, 4 * 60 * 60 * 1000)
    }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// Enable running .exe files
ipcMain.handle('open-win-app', (_, command) => {
  try {
    const { exec } = require('child_process');
    exec(command);
  } catch (e) {
    console.error(e);
  }
})