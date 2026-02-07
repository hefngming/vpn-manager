import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 类型定义
declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void
      closeWindow: () => void
      connectVPN: (config: any) => Promise<{ success: boolean }>
      disconnectVPN: () => Promise<{ success: boolean }>
      setSystemProxy: (enabled: boolean, port: number) => Promise<{ success: boolean }>
      onTrayAction: (callback: (action: string) => void) => void
    }
  }
}

const API_BASE_URL = 'http://localhost:3000'

interface Node {
  id: string
  displayName: string
  countryCode: string
  latency: number
  load: number
}

interface UserInfo {
  email: string
  planType: string
  dailyUsage: string
  dailyLimit: number | null
  remainingBytes: number | null
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [view, setView] = useState<'login' | 'main' | 'settings' | 'purchase'>('login')
  const [user, setUser] = useState<UserInfo | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [connectionTime, setConnectionTime] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // 连接时长计时
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (connected) {
      interval = setInterval(() => setConnectionTime(t => t + 1), 1000)
    } else {
      setConnectionTime(0)
    }
    return () => clearInterval(interval)
  }, [connected])

  // 监听托盘操作
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onTrayAction((action) => {
        if (action === 'connect' && !connected) {
          handleConnect()
        } else if (action === 'disconnect' && connected) {
          handleDisconnect()
        }
      })
    }
  }, [connected, selectedNode])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFlag = (code: string) => {
    const flags: Record<string, string> = {
      'CN': '🇨🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷',
      'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'DE': '🇩🇪',
      'UK': '🇬🇧', 'FR': '🇫🇷', 'AU': '🇦🇺', 'CA': '🇨🇦',
    }
    return flags[code?.toUpperCase()] || '🌐'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
        await loadUserData(data.token)
        setView('main')
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      setError('网络错误')
    }
  }

  const loadUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/client/nodes`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setNodes(data.nodes)
      }
    } catch (err) {
      console.error('Failed to load user data:', err)
    }
  }

  const handleConnect = async () => {
    if (!selectedNode || !token) return
    
    setConnecting(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/client/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nodeId: selectedNode })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // 调用 Electron 设置系统代理
        if (window.electronAPI) {
          await window.electronAPI.connectVPN(data.config)
          await window.electronAPI.setSystemProxy(true, 7890)
        }
        setConnected(true)
      } else {
        setError(data.error || '连接失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.disconnectVPN()
        await window.electronAPI.setSystemProxy(false, 7890)
      }
      setConnected(false)
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setView('login')
  }

  // 登录界面
  if (view === 'login') {
    return (
      <div className="app-container">
        <div className="window-controls">
          <button onClick={() => window.electronAPI?.minimizeWindow()}>−</button>
          <button onClick={() => window.electronAPI?.closeWindow()}>×</button>
        </div>
        
        <div className="login-screen">
          <div className="logo-large">🦞</div>
          <h1>小龙虾VPN</h1>
          <p className="subtitle">简单、快速、安全的网络加速</p>
          
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="error">{error}</div>}
            <button type="submit" className="btn-primary">登录</button>
          </form>
          
          <p className="hint">还没有账户？访问网页版注册</p>
        </div>
      </div>
    )
  }

  // 主界面
  return (
    <div className="app-container">
      <div className="window-controls">
        <button onClick={() => window.electronAPI?.minimizeWindow()}>−</button>
        <button onClick={() => window.electronAPI?.closeWindow()}>×</button>
      </div>
      
      <div className="main-screen">
        {/* 状态栏 */}
        <div className={`status-bar ${connected ? 'connected' : ''}`}>
          <div className="status-indicator">
            <div className={`status-dot ${connected ? 'pulse' : ''}`} />
            <span>{connected ? '已连接' : '未连接'}</span>
          </div>
          {connected && (
            <div className="timer">{formatTime(connectionTime)}</div>
          )}
        </div>

        {/* 主连接区 */}
        <div className="connection-area">
          {connected ? (
            <>
              <div className="connection-icon active">⚡</div>
              <h2>连接成功</h2>
              <p className="connected-node">
                {getFlag(nodes.find(n => n.id === selectedNode)?.countryCode || '')}
                {nodes.find(n => n.id === selectedNode)?.displayName}
              </p>
              <button className="btn-disconnect" onClick={handleDisconnect}>
                断开连接
              </button>
            </>
          ) : (
            <>
              <div className="connection-icon">🔒</div>
              <h2>未连接</h2>
              <p>选择节点开始加速</p>
            </>
          )}
        </div>

        {/* 流量信息 */}
        {user?.dailyLimit && (
          <div className="traffic-info">
            <div className="traffic-bar-container">
              <div className="traffic-bar">
                <div 
                  className="traffic-fill" 
                  style={{ 
                    width: `${Math.min(100, (parseInt(user.dailyUsage) / user.dailyLimit) * 100)}%` 
                  }}
                />
              </div>
              <span className="traffic-text">
                {formatBytes(parseInt(user.dailyUsage))} / {formatBytes(user.dailyLimit)}
              </span>
            </div>
          </div>
        )}

        {/* 节点列表 */}
        <div className="nodes-list">
          <h3>选择节点</h3>
          {nodes.map(node => (
            <div
              key={node.id}
              className={`node-item ${selectedNode === node.id ? 'selected' : ''} ${connected && selectedNode === node.id ? 'connected' : ''}`}
              onClick={() => !connected && setSelectedNode(node.id)}
            >
              <span className="node-flag">{getFlag(node.countryCode)}</span>
              <div className="node-info">
                <span className="node-name">{node.displayName}</span>
                <span className={`node-latency ${node.latency < 50 ? 'good' : node.latency < 100 ? 'medium' : 'bad'}`}>
                  {node.latency}ms
                </span>
              </div>
              {!connected && selectedNode === node.id && (
                <button 
                  className="btn-connect" 
                  onClick={(e) => { e.stopPropagation(); handleConnect(); }}
                  disabled={connecting}
                >
                  {connecting ? '...' : '连接'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="app-footer">
          <span>{user?.email}</span>
          <button className="btn-settings" onClick={handleLogout}>退出</button>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
