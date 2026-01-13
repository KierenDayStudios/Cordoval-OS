import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { release } from 'node:os'
import { join } from 'node:path'
import { exec } from 'node:child_process'

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

let win: BrowserWindow | null = null

const setupAutoUpdater = (): void => {
  // Configure auto-updater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

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
}

const createWindow = (): void => {
  console.log('--- CORDOVAL OS BOOTING: APPLYING CONFIG ---')
  console.log(`App Version: ${app.getVersion()}`)

  const isDev = process.env.NODE_ENV === 'development'
  const url = isDev
    ? 'http://localhost:5173/'
    : new URL(join(__dirname, '../renderer/index.html'), 'file://').toString()

  win = new BrowserWindow({
    title: 'Cordoval OS',
    width: 1920,
    height: 1080,
    x: 0,
    y: 0,
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    kiosk: false,
    thickFrame: false,
    type: 'desktop',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      webSecurity: false
    }
  })

  if (isDev) {
    win.loadURL(url)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Handle persistent permission checks
  win.webContents.session.setPermissionCheckHandler((_webContents, permission) => {
    const allowed = ['media', 'audioCapture', 'speechRecognition', 'notifications', 'microphone']
    return allowed.includes(permission)
  })

  win.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowedPermissions = [
      'media',
      'audioCapture',
      'speechRecognition',
      'notifications',
      'microphone'
    ]
    if (allowedPermissions.includes(permission)) {
      callback(true)
    } else {
      callback(false)
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('did-finish-load', () => {
    if (!isDev) {
      console.log('Checking for updates on startup...')
      setTimeout(() => {
        autoUpdater.checkForUpdates()
      }, 3000)

      setInterval(
        () => {
          autoUpdater.checkForUpdates()
        },
        4 * 60 * 60 * 1000
      )
    }
  })
}

app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId(app.getName())

  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  setupAutoUpdater()

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  createWindow()
})

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

ipcMain.handle('open-win-app', (_, command) => {
  try {
    exec(command)
  } catch (e) {
    console.error(e)
  }
})
