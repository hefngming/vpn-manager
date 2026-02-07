import { app, BrowserWindow, ipcMain, nativeTheme, Tray, Menu } from 'electron'
import path from 'path'

// 保持窗口对象的全局引用
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 700,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png')
  })

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 创建系统托盘
  createTray()
}

// 创建系统托盘
function createTray() {
  tray = new Tray(path.join(__dirname, '../assets/tray-icon.png'))
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示应用', click: () => mainWindow?.show() },
    { label: '连接', click: () => {
      mainWindow?.webContents.send('tray-action', 'connect')
    }},
    { label: '断开', click: () => {
      mainWindow?.webContents.send('tray-action', 'disconnect')
    }},
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])
  
  tray.setToolTip('小龙虾VPN')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
      }
    }
  })
}

// 应用就绪
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 关闭所有窗口时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 处理 - 窗口控制
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window-close', () => {
  mainWindow?.hide() // 最小化到托盘而不是关闭
})

ipcMain.handle('window-show', () => {
  mainWindow?.show()
})

// IPC 处理 - VPN 连接（这里需要集成实际的 VPN 库）
ipcMain.handle('vpn-connect', async (event, config) => {
  console.log('Connecting with config:', config)
  // TODO: 集成 shadowsocks-libev 或 clash 核心
  // 这里应该启动本地代理进程
  return { success: true }
})

ipcMain.handle('vpn-disconnect', async () => {
  console.log('Disconnecting VPN')
  // TODO: 停止本地代理进程
  return { success: true }
})

// IPC 处理 - 系统代理设置
ipcMain.handle('set-system-proxy', async (event, enabled: boolean, port: number) => {
  const platform = process.platform
  
  try {
    if (platform === 'win32') {
      // Windows 设置系统代理
      const { exec } = require('child_process')
      if (enabled) {
        exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`)
        exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d 127.0.0.1:${port} /f`)
      } else {
        exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`)
      }
    } else if (platform === 'darwin') {
      // macOS 设置系统代理
      const { exec } = require('child_process')
      const services = ['Wi-Fi', 'Ethernet']
      for (const service of services) {
        if (enabled) {
          exec(`networksetup -setwebproxy "${service}" 127.0.0.1 ${port}`)
          exec(`networksetup -setsecurewebproxy "${service}" 127.0.0.1 ${port}`)
        } else {
          exec(`networksetup -setwebproxystate "${service}" off`)
          exec(`networksetup -setsecurewebproxystate "${service}" off`)
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Failed to set system proxy:', error)
    return { success: false, error: String(error) }
  }
})

// 监听主题变化
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors)
})
