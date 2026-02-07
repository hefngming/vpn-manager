import { app, BrowserWindow, ipcMain, nativeTheme, Tray, Menu } from 'electron'
import path from 'path'
import { clashService } from './clash-service'
// import { vpnService } from './vpn-service' // 备选方案

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

// 应用退出前清理
app.on('before-quit', async () => {
  await clashService.disconnect()
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

// 设置系统代理
async function setSystemProxy(enabled: boolean, port: number): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform
  const { exec } = require('child_process')
  
  return new Promise((resolve) => {
    try {
      if (platform === 'win32') {
        // Windows 设置系统代理
        if (enabled) {
          exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f`, (err: any) => {
            if (err) {
              resolve({ success: false, error: String(err) })
              return
            }
            exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d 127.0.0.1:${port} /f`, (err2: any) => {
              resolve({ success: !err2, error: err2 ? String(err2) : undefined })
            })
          })
        } else {
          exec(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f`, (err: any) => {
            resolve({ success: !err, error: err ? String(err) : undefined })
          })
        }
      } else if (platform === 'darwin') {
        // macOS 设置系统代理
        const services = ['Wi-Fi', 'Ethernet']
        let errors: string[] = []
        let completed = 0
        const total = services.length * (enabled ? 2 : 2)
        
        for (const service of services) {
          if (enabled) {
            exec(`networksetup -setwebproxy "${service}" 127.0.0.1 ${port}`, (err: any) => {
              if (err) errors.push(String(err))
              completed++
              if (completed === total) {
                resolve({ success: errors.length === 0, error: errors.join(', ') || undefined })
              }
            })
            exec(`networksetup -setsecurewebproxy "${service}" 127.0.0.1 ${port}`, (err: any) => {
              if (err) errors.push(String(err))
              completed++
              if (completed === total) {
                resolve({ success: errors.length === 0, error: errors.join(', ') || undefined })
              }
            })
          } else {
            exec(`networksetup -setwebproxystate "${service}" off`, (err: any) => {
              if (err) errors.push(String(err))
              completed++
              if (completed === total) {
                resolve({ success: errors.length === 0, error: errors.join(', ') || undefined })
              }
            })
            exec(`networksetup -setsecurewebproxystate "${service}" off`, (err: any) => {
              if (err) errors.push(String(err))
              completed++
              if (completed === total) {
                resolve({ success: errors.length === 0, error: errors.join(', ') || undefined })
              }
            })
          }
        }
      } else {
        // Linux 暂不支持自动设置
        resolve({ success: true })
      }
    } catch (error) {
      resolve({ success: false, error: String(error) })
    }
  })
}

// IPC 处理 - VPN 连接
ipcMain.handle('vpn-connect', async (event, config) => {
  console.log('Connecting with config:', config)
  
  // 使用 Clash 服务
  const result = await clashService.connect({
    name: config.name || 'Proxy',
    type: config.type || 'ss',
    server: config.server,
    port: config.port,
    password: config.password,
    method: config.method,
    uuid: config.uuid,
    alterId: config.alterId,
    security: config.security,
  })
  
  if (result.success) {
    // 连接成功后自动设置系统代理
    const port = clashService.getLocalPort()
    await setSystemProxy(true, port)
    
    // 更新托盘菜单状态
    updateTrayMenu(true)
  }
  
  return result
})

ipcMain.handle('vpn-disconnect', async () => {
  console.log('Disconnecting VPN')
  await clashService.disconnect()
  
  // 断开连接后关闭系统代理
  await setSystemProxy(false, 0)
  
  // 更新托盘菜单状态
  updateTrayMenu(false)
  
  return { success: true }
})

// 更新托盘菜单
function updateTrayMenu(isConnected: boolean) {
  if (!tray) return
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示应用', click: () => mainWindow?.show() },
    { type: 'separator' },
    isConnected 
      ? { label: '🔵 已连接', enabled: false }
      : { label: '⚪ 未连接', enabled: false },
    { type: 'separator' },
    { label: '退出', click: () => {
      clashService.disconnect()
      app.quit()
    }}
  ])
  
  tray.setContextMenu(contextMenu)
  tray.setToolTip(isConnected ? '🦞 小龙虾VPN - 已连接' : '🦞 小龙虾VPN - 未连接')
}

// IPC 处理 - 系统代理设置（供渲染进程调用）
ipcMain.handle('set-system-proxy', async (event, enabled: boolean, port: number) => {
  return await setSystemProxy(enabled, port)
})

// 监听主题变化
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors)
})
