// API配置 - 使用域名访问
export const API_BASE_URL = '' // 使用相对路径，自动跟随当前域名

// 域名配置
export const DOMAIN = 'dj.siumingho.dpdns.org'
export const API_DOMAIN = 'dj.siumingho.dpdns.org'

// 构建完整的API URL
export const getApiUrl = (path: string) => {
  // 使用相对路径，自动跟随当前域名
  return path.startsWith('/') ? path : `/${path}`
}

// 下载链接配置
export const DOWNLOAD_URLS = {
  WINDOWS: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-Windows-v1.0.0.exe',
  MACOS: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-macOS-v1.0.0.dmg',
  LINUX: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-Linux-v1.0.0.AppImage',
  ANDROID: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-Android-v1.0.0.apk',
  IOS: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-iOS-v1.0.0.ipa'
}

// 价格配置
export const PLANS = {
  FREE: {
    name: '免费版',
    price: '¥0',
    traffic: '1GB',
    duration: '1天',
    maxDevices: 1
  },
  PREMIUM: {
    name: '无限尊享',
    price: '¥199/月',
    traffic: '无限',
    duration: '30天',
    maxPCDevices: 1,
    maxMobileDevices: 1,
    maxTotalDevices: 2
  }
}
