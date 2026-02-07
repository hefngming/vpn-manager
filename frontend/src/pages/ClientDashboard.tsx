import { useState, useEffect } from 'react'
import axios from 'axios'

interface ClientDashboardProps {
  token: string
  onLogout: () => void
}

interface Node {
  id: string
  displayName: string
  countryCode: string
  tier: string
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

export default function ClientDashboard({ token, onLogout }: ClientDashboardProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [connectedNode, setConnectedNode] = useState<string | null>(null)
  const [connectionTime, setConnectionTime] = useState<number>(0)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNodes()
  }, [token])

  // 连接时长计时器
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (connectedNode) {
      interval = setInterval(() => {
        setConnectionTime(prev => prev + 1)
      }, 1000)
    } else {
      setConnectionTime(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [connectedNode])

  const fetchNodes = async () => {
    try {
      const response = await axios.get('/api/client/nodes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.user)
      setNodes(response.data.nodes)
    } catch (err: any) {
      setError(err.response?.data?.error || '获取节点失败')
      if (err.response?.status === 401) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const connect = async (node: Node) => {
    setConnecting(true)
    setError('')
    
    try {
      // 调用后端获取加密配置
      const response = await axios.post('/api/client/connect', 
        { nodeId: node.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (response.data.success) {
        setConnectedNode(node.id)
        
        // 在实际客户端应用中，这里会将配置传递给本地VPN客户端
        // 在Web版本中，我们模拟连接成功
        console.log('Connected with config:', response.data.config)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '连接失败')
      setConnectedNode(null)
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    setConnectedNode(null)
    setConnectionTime(0)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getFlag = (code: string) => {
    const flags: Record<string, string> = {
      'CN': '🇨🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷',
      'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'DE': '🇩🇪',
      'UK': '🇬🇧', 'FR': '🇫🇷', 'AU': '🇦🇺', 'CA': '🇨🇦',
    }
    return flags[code?.toUpperCase()] || '🌐'
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return '#10b981' // 绿色
    if (latency < 100) return '#f59e0b' // 黄色
    return '#ef4444' // 红色
  }

  if (loading) return <div className="client-container"><div className="loading">加载中...</div></div>
  if (error && !user) return <div className="client-container"><div className="error">{error}</div></div>
  if (!user) return null

  const usagePercent = user.dailyLimit 
    ? Math.min(100, (parseInt(user.dailyUsage) / user.dailyLimit) * 100)
    : 0

  return (
    <div className="client-container">
      {/* 头部 - 连接状态 */}
      <div className={`status-bar ${connectedNode ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator">
          <div className={`status-dot ${connectedNode ? 'pulse' : ''}`} />
          <span>{connectedNode ? '已连接' : '未连接'}</span>
        </div>
        {connectedNode && (
          <div className="connection-timer">
            {formatTime(connectionTime)}
          </div>
        )}
        <button className="btn-icon" onClick={onLogout}>退出</button>
      </div>

      {/* 主连接区 */}
      <div className="main-connect">
        {connectedNode ? (
          <div className="connected-view">
            <div className="connected-icon">⚡</div>
            <h2>连接成功</h2>
            <p className="connected-node">
              {getFlag(nodes.find(n => n.id === connectedNode)?.countryCode || '')} 
              {nodes.find(n => n.id === connectedNode)?.displayName}
            </p>
            <button className="btn-disconnect" onClick={disconnect}>
              断开连接
            </button>
          </div>
        ) : (
          <div className="disconnected-view">
            <div className="disconnected-icon">🔒</div>
            <h2>未连接</h2>
            <p>选择下方节点开始加速</p>
          </div>
        )}
      </div>

      {/* 流量信息 */}
      {user.dailyLimit && (
        <div className="traffic-card">
          <div className="traffic-header">
            <span>今日流量</span>
            <span className="traffic-remaining">
              剩余 {formatBytes(user.remainingBytes || 0)}
            </span>
          </div>
          <div className="traffic-bar">
            <div 
              className="traffic-fill" 
              style={{ 
                width: `${usagePercent}%`,
                background: usagePercent > 80 ? '#ef4444' : '#667eea'
              }}
            />
          </div>
          <div className="traffic-stats">
            {formatBytes(parseInt(user.dailyUsage))} / {formatBytes(user.dailyLimit)}
          </div>
        </div>
      )}

      {/* 节点列表 */}
      <div className="nodes-section">
        <h3>选择节点</h3>
        <div className="nodes-list">
          {nodes.map(node => (
            <div 
              key={node.id} 
              className={`node-item ${connectedNode === node.id ? 'active' : ''}`}
              onClick={() => !connectedNode && connect(node)}
            >
              <div className="node-flag">{getFlag(node.countryCode)}</div>
              <div className="node-info">
                <div className="node-name">{node.displayName}</div>
                <div className="node-meta">
                  <span 
                    className="latency"
                    style={{ color: getLatencyColor(node.latency) }}
                  >
                    ● {node.latency}ms
                  </span>
                  <span className="load">负载 {node.load}%</span>
                </div>
              </div>
              <button 
                className="btn-connect-small"
                disabled={connecting || !!connectedNode}
                onClick={(e) => {
                  e.stopPropagation()
                  connect(node)
                }}
              >
                {connecting ? '...' : '连接'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="client-footer">
        <span>{user.email}</span>
        <span className={`plan-tag ${user.planType.toLowerCase()}`}>
          {user.planType === 'FREE' ? '免费版' : '付费版'}
        </span>
      </div>

      {error && <div className="toast-error">{error}</div>}
    </div>
  )
}
