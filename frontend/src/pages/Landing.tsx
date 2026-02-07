import { useState } from 'react'

interface LandingProps {
  onLogin?: (token: string) => void
}

export default function Landing({ onLogin }: LandingProps) {
  const [showAuth, setShowAuth] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const plans = [
    {
      name: '免费版',
      price: '¥0',
      period: '/月',
      features: ['每日 1GB 流量', '3个免费节点', '基础速度', '单设备'],
      popular: false,
      button: '免费开始'
    },
    {
      name: '基础版',
      price: '¥15',
      period: '/月',
      features: ['无限流量', '全部节点', '高速线路', '3台设备', '优先客服'],
      popular: true,
      button: '立即订阅'
    },
    {
      name: '高级版',
      price: '¥30',
      period: '/月',
      features: ['无限流量', '全部节点', '专线加速', '5台设备', '专属客服', '游戏优化'],
      popular: false,
      button: '立即订阅'
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // 这里应该调用后端API
      // 为了演示，模拟成功
      setTimeout(() => {
        setMessage(isRegister ? '注册成功！请下载客户端使用' : '登录成功！请下载客户端使用')
        if (onLogin) {
          onLogin('mock-token')
        }
        setLoading(false)
      }, 1000)
    } catch (error) {
      setMessage('操作失败')
      setLoading(false)
    }
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <span className="logo">🦞</span>
          <span className="brand-name">小龙虾VPN</span>
        </div>
        <div className="nav-links">
          <button onClick={() => scrollToSection('features')}>功能</button>
          <button onClick={() => scrollToSection('pricing')}>价格</button>
          <button onClick={() => scrollToSection('download')}>下载</button>
          <button className="btn-login" onClick={() => { setShowAuth(true); setIsRegister(false) }}>登录</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>🦞 小龙虾VPN</h1>
          <p className="hero-subtitle">简单、快速、安全的网络加速体验</p>
          <p className="hero-desc">无需配置，一键连接，像使用商业加速器一样简单</p>
          <div className="hero-buttons">
            <button className="btn-primary-large" onClick={() => scrollToSection('download')}>
              免费下载
            </button>
            <button className="btn-secondary-large" onClick={() => scrollToSection('pricing')}>
              查看套餐
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">全球节点</span>
            </div>
            <div className="stat">
              <span className="stat-number">100万+</span>
              <span className="stat-label">活跃用户</span>
            </div>
            <div className="stat">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">在线率</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="app-mockup">
            <div className="mockup-screen">
              <div className="mockup-header">🦞 小龙虾VPN</div>
              <div className="mockup-status connected">● 已连接</div>
              <div className="mockup-timer">00:23:45</div>
              <div className="mockup-node">🇭🇰 香港节点 01</div>
              <button className="mockup-btn">断开连接</button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>为什么选择小龙虾VPN</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🚀</span>
            <h3>一键连接</h3>
            <p>无需复杂配置，打开应用点击连接即可使用，像商业加速器一样简单</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>高速稳定</h3>
            <p>全球50+优质节点，智能路由选择，保证低延迟高速度</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>安全加密</h3>
            <p>采用AES-256-GCM加密，保护您的网络数据安全</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📱</span>
            <h3>全平台支持</h3>
            <p>支持Windows、macOS、Linux、iOS、Android全平台</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🎮</span>
            <h3>游戏优化</h3>
            <p>专线优化游戏延迟，支持主流外服游戏加速</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💰</span>
            <h3>灵活付费</h3>
            <p>免费版永久可用，付费版支持支付宝/微信，随时取消</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <h2>选择适合您的套餐</h2>
        <p className="pricing-subtitle">免费版永久可用，付费版随时可退</p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <span className="popular-badge">推荐</span>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="price-number">{plan.price}</span>
                <span className="price-period">{plan.period}</span>
              </div>
              <ul className="features-list">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
              <button 
                className={`btn-plan ${plan.popular ? 'btn-popular' : ''}`}
                onClick={() => { setShowAuth(true); setIsRegister(true) }}
              >
                {plan.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download">
        <h2>下载小龙虾VPN</h2>
        <p className="download-subtitle">支持所有主流平台，即刻开始加速体验</p>
        <div className="download-grid">
          <div className="download-card-landing">
            <span className="platform-icon-large">🪟</span>
            <h3>Windows</h3>
            <p>Windows 10/11</p>
            <a 
              href="https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-windows.exe"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-download-landing"
            >
              下载客户端
            </a>
            <span className="file-info">v1.0.0 · 45 MB</span>
          </div>
          <div className="download-card-landing">
            <span className="platform-icon-large">🍎</span>
            <h3>macOS</h3>
            <p>macOS 11.0+</p>
            <a 
              href="https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-macos.dmg"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-download-landing"
            >
              下载客户端
            </a>
            <span className="file-info">v1.0.0 · 52 MB</span>
          </div>
          <div className="download-card-landing">
            <span className="platform-icon-large">📱</span>
            <h3>iOS</h3>
            <p>iOS 14.0+</p>
            <a 
              href="https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-ios.ipa"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-download-landing"
            >
              下载 IPA
            </a>
            <span className="file-info">v1.0.0 · 28 MB</span>
          </div>
          <div className="download-card-landing">
            <span className="platform-icon-large">🤖</span>
            <h3>Android</h3>
            <p>Android 8.0+</p>
            <a 
              href="https://github.com/hefngming/vpn-manager/releases/download/v1.0.0/xiaolonglong-vpn-android.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-download-landing"
            >
              下载 APK
            </a>
            <span className="file-info">v1.0.0 · 32 MB</span>
          </div>
        </div>
        <p className="download-note">💡 下载客户端后注册/登录即可使用，所有功能都在客户端内完成</p>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo">🦞</span>
            <span>小龙虾VPN</span>
          </div>
          <div className="footer-links">
            <a href="#">使用条款</a>
            <a href="#">隐私政策</a>
            <a href="#">联系我们</a>
          </div>
        </div>
        <p className="copyright">© 2024 小龙虾VPN. All rights reserved.</p>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="modal-overlay" onClick={() => setShowAuth(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuth(false)}>×</button>
            <h2>{isRegister ? '创建账户' : '登录账户'}</h2>
            <p className="modal-subtitle">
              {isRegister ? '注册后请下载客户端使用' : '登录后即可下载客户端'}
            </p>
            
            {message && <div className="modal-message">{message}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
              </button>
            </form>
            
            <p className="modal-switch">
              {isRegister ? '已有账户？' : '没有账户？'}
              <button onClick={() => { setIsRegister(!isRegister); setMessage('') }}>
                {isRegister ? '去登录' : '去注册'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
