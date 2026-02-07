import { useState, useEffect } from 'react'
import axios from 'axios'

interface DashboardProps {
  token: string
  onLogout: () => void
}

interface Node {
  id: string
  displayName: string
  config: string
}

interface UserData {
  email: string
  planType: string
  dailyUsage: string
}

interface SubscriptionData {
  user: UserData
  nodes: Node[]
}

interface UsageData {
  dailyUsage: string
  limit: number | null
  remaining: string | null
  planType: string
  planExpiresAt: string | null
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const [subRes, usageRes] = await Promise.all([
        axios.get('/api/subscription', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/traffic/usage', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      setData(subRes.data)
      setUsage(usageRes.data)
    } catch (err: any) {
      setError(err.response?.data?.error || '获取数据失败')
      if (err.response?.status === 401) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const copyConfig = (node: Node) => {
    navigator.clipboard.writeText(node.config)
    setCopiedId(node.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatBytes = (bytes: string) => {
    const num = parseInt(bytes)
    if (num === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(num) / Math.log(k))
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) return <div className="dashboard-container"><div className="loading">加载中...</div></div>
  if (error) return <div className="dashboard-container"><div className="error">{error}</div></div>
  if (!data) return null

  const usagePercent = usage?.limit 
    ? Math.min(100, (parseInt(usage.dailyUsage) / usage.limit) * 100)
    : 0

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand">
          <span className="logo">🦞</span>
          <h1>小龙虾VPN</h1>
        </div>
        <div className="user-info">
          <span className="email">{data.user.email}</span>
          <span className={`plan-badge ${data.user.planType.toLowerCase()}`}>
            {data.user.planType === 'FREE' ? '免费版' : data.user.planType}
          </span>
          <button className="btn-logout" onClick={onLogout}>退出</button>
        </div>
      </header>

      <main className="dashboard-main">
        {usage && usage.limit && (
          <div className="usage-card">
            <h3>今日流量使用情况</h3>
            <div className="usage-bar">
              <div 
                className="usage-fill" 
                style={{ width: `${usagePercent}%`, background: usagePercent > 80 ? '#e74c3c' : '#667eea' }}
              />
            </div>
            <div className="usage-stats">
              <span>已用: {formatBytes(usage.dailyUsage)}</span>
              <span>剩余: {formatBytes(usage.remaining || '0')}</span>
              <span>总计: {formatBytes(usage.limit.toString())}</span>
            </div>
          </div>
        )}

        <div className="nodes-section">
          <h2>可用节点</h2>
          <div className="nodes-grid">
            {data.nodes.map(node => (
              <div key={node.id} className="node-card">
                <div className="node-header">
                  <h3>{node.displayName}</h3>
                  <span className="node-status active">●</span>
                </div>
                <button 
                  className="btn-copy"
                  onClick={() => copyConfig(node)}
                >
                  {copiedId === node.id ? '✓ 已复制' : '复制配置'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
