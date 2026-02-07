import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  showWindow: () => ipcRenderer.invoke('window-show'),
  
  // VPN 控制
  connectVPN: (config: any) => ipcRenderer.invoke('vpn-connect', config),
  disconnectVPN: () => ipcRenderer.invoke('vpn-disconnect'),
  
  // 系统代理
  setSystemProxy: (enabled: boolean, port: number) => 
    ipcRenderer.invoke('set-system-proxy', enabled, port),
  
  // 监听事件
  onTrayAction: (callback: (action: string) => void) => {
    ipcRenderer.on('tray-action', (_, action) => callback(action))
  },
  
  onThemeChange: (callback: (isDark: boolean) => void) => {
    ipcRenderer.on('theme-changed', (_, isDark) => callback(isDark))
  }
})
