import { useState, useEffect } from 'react'
import axios from 'axios'

interface DownloadPageProps {
  token: string
  onLogout: () => void
}

interface UserInfo {
  email: string
  planType: string
  dailyUsage: string
  dailyLimit: number | null
}

export default function DownloadPage({ token, onLogout }: DownloadPageProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchUserInfo()
  }, [token])

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/api/client/nodes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
    } catch (err: any) {
      if (err.response?.status === 401) {
        onLogout()
      }
    }
  }

  const copySubscriptionLink = () => {
    const link = `${window.location.origin}/api/client/subscription-config`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  interface DownloadItem {
    name: string
    icon: string
    version: string
    size: string
    url: string
    requirement: string
    badge?: string
  }

  const downloads: { desktop: DownloadItem[]; mobile: DownloadItem[] } = {
    desktop: [
      {
        name: 'Windows',
        icon: '🪟',
        version: 'v1.0.0',
        size: '45 MB',
        url: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-Windows-v1.0.0.exe',
        requirement: 'Windows 10/11 64位'
      },
      {
        name: 'macOS',
        icon: '🍎',
        version: 'v1.0.0',
        size: '52 MB',
        url: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-macOS-v1.0.0.dmg',
        requirement: 'macOS 11.0+'
      },
      {
        name: 'Linux',
        icon: '🐧',
        version: 'v1.0.0',
        size: '38 MB',
        url: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-Linux-v1.0.0.AppImage',
        requirement: 'Ubuntu 20.04+/Debian 11+'
      }
    ],
    mobile: [
      {
        name: 'iOS',
        icon: '📱',
        version: 'v1.0.0',
        size: '28 MB',
        url: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-iOS-v1.0.0.ipa',
        requirement: 'iOS 14.0+',
        badge: '下载IPA'
      },
      {
        name: 'Android',
        icon: '🤖',
        version: 'v1.0.0',
        size: '32 MB',
        url: 'https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/LogVPN-Android-v1.0.0.apk',
        requirement: 'Android 8.0+',
        badge: '下载APK'
      }
    ]
  }

  if (!user) return <div className="download-container"><div className="loading">加载中...</div></div>

  return (
    <div className="download-container">
      {/* Header */}
      <header className="download-header">
        <div className="brand">
          <span className="logo">🦞</span>
          <h1>小龙虾VPN</h1>
        </div>
        <div className="user-info">
          <span className="email">{user.email}</span>
          <span className={`plan-badge ${user.planType.toLowerCase()}`}>
            {user.planType === 'FREE' ? '免费版' : '付费版'}
          </span>
          <button className="btn-text" onClick={onLogout}>退出</button>
        </div>
      </header>

      <main className="download-main">
        {/* Hero Section */}
        <div className="download-hero">
          <h2>下载小龙虾VPN客户端</h2>
          <p>选择适合您设备的版本，享受安全快速的网络加速体验</p>
          
          {user.dailyLimit && (
            <div className="usage-mini">
              <span>今日流量: {Math.round((parseInt(user.dailyUsage) / user.dailyLimit) * 100)}% 已用</span>
              <div className="usage-bar-mini">
                <div 
                  className="usage-fill-mini" 
                  style={{ width: `${Math.min(100, (parseInt(user.dailyUsage) / user.dailyLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="download-tabs">
          <button 
            className={`tab ${activeTab === 'desktop' ? 'active' : ''}`}
            onClick={() => setActiveTab('desktop')}
          >
            💻 桌面端
          </button>
          <button 
            className={`tab ${activeTab === 'mobile' ? 'active' : ''}`}
            onClick={() => setActiveTab('mobile')}
          >
            📱 移动端
          </button>
        </div>

        {/* Download Cards */}
        <div className="download-grid">
          {downloads[activeTab].map((item) => (
            <div key={item.name} className="download-card">
              <div className="download-card-header">
                <span className="platform-icon">{item.icon}</span>
                <div className="platform-info">
                  <h3>{item.name}</h3>
                  <span className="version">{item.version}</span>
                </div>
              </div>
              
              <div className="download-card-body">
                <p className="requirement">{item.requirement}</p>
                <p className="file-size">{item.size}</p>
              </div>
              
              <button className="btn-download">
                立即下载
              </button>
              
              {item.badge && (
                <span className="store-badge">{item.badge}</span>
              )}
            </div>
          ))}
        </div>

        {/* Subscription Link */}
        <div className="subscription-section">
          <h3>🌐 已有第三方客户端？</h3>
          <p>使用订阅链接导入配置到 Clash、V2Ray 等客户端</p>
          <div className="subscription-box">
            <code>{window.location.origin}/api/client/subscription-config</code>
            <button 
              className="btn-copy-link"
              onClick={copySubscriptionLink}
            >
              {copied ? '✓ 已复制' : '复制链接'}
            </button>
          </div>
        </div>

        {/* Quick Guide */}
        <div className="guide-section">
          <h3>📖 快速开始</h3>
          <div className="guide-steps">
            <div className="guide-step">
              <span className="step-number">1</span>
              <p>下载并安装适合您设备的客户端</p>
            </div>
            <div className="guide-step">
              <span className="step-number">2</span>
              <p>打开客户端，使用当前账号登录</p>
            </div>
            <div className="guide-step">
              <span className="step-number">3</span>
              <p>选择节点，点击连接即可享受加速</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="faq-section">
          <h3>❓ 常见问题</h3>
          <div className="faq-list">
            <details className="faq-item">
              <summary>客户端支持哪些协议？</summary>
              <p>目前支持 Shadowsocks、VMess 和 Trojan 协议，后续会添加更多协议支持。</p>
            </details>
            <details className="faq-item">
              <summary>免费版和付费版有什么区别？</summary>
              <p>免费版每天可使用 1GB 流量，可连接免费节点。付费版无限流量，可使用全部节点。</p>
            </details>
            <details className="faq-item">
              <summary>如何升级到付费版？</summary>
              <p>客户端内支持支付宝、微信支付，或联系管理员开通。</p>
            </details>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="download-footer">
        <p>🦞 小龙虾VPN - 让翻墙变得简单</p>
        <p className="copyright">© 2024 小龙虾VPN. All rights reserved.</p>
      </footer>
    </div>
  )
}
