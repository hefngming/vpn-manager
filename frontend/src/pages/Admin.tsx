import { useState, useEffect } from 'react'
import axios from 'axios'

interface AdminProps {
  token: string
  onLogout: () => void
}

interface Node {
  id: string
  displayName: string
  countryCode: string
  tier: string
  priority: number
  isActive: boolean
}

export default function Admin({ token, onLogout }: AdminProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [displayName, setDisplayName] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [config, setConfig] = useState('')
  const [tier, setTier] = useState('FREE')
  const [priority, setPriority] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchNodes()
  }, [token])

  const fetchNodes = async () => {
    try {
      const response = await axios.get('/admin/nodes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNodes(response.data.nodes)
    } catch (err: any) {
      setError(err.response?.data?.error || '获取节点失败')
      if (err.response?.status === 403) {
        setError('需要管理员权限')
      }
      if (err.response?.status === 401) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await axios.post('/admin/nodes', {
        displayName,
        countryCode,
        config,
        tier,
        priority
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setSuccess('节点创建成功！')
      setDisplayName('')
      setCountryCode('')
      setConfig('')
      setPriority(0)
      fetchNodes()
    } catch (err: any) {
      setError(err.response?.data?.error || '创建节点失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="dashboard-container"><div className="loading">加载中...</div></div>

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand">
          <span className="logo">🦞</span>
          <h1>小龙虾VPN - 管理后台</h1>
        </div>
        <div className="user-info">
          <button className="btn-logout" onClick={onLogout}>退出</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="admin-grid">
          <div className="admin-card">
            <h2>添加新节点</h2>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>节点名称</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="例如：香港节点 01"
                  required
                />
              </div>

              <div className="form-group">
                <label>国家代码</label>
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="例如：HK"
                />
              </div>

              <div className="form-group">
                <label>配置内容 (JSON)</label>
                <textarea
                  value={config}
                  onChange={(e) => setConfig(e.target.value)}
                  placeholder={`{ "server": "xxx.com", "port": 443, ... }`}
                  rows={6}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label> tier </label>
                  <select value={tier} onChange={(e) => setTier(e.target.value)}>
                    <option value="FREE">免费</option>
                    <option value="PAID">付费</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>优先级</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? '创建中...' : '创建节点'}
              </button>
            </form>
          </div>

          <div className="admin-card">
            <h2>现有节点 ({nodes.length})</h2>
            <div className="nodes-list">
              {nodes.map(node => (
                <div key={node.id} className="node-item">
                  <div className="node-info">
                    <span className="node-name">{node.displayName}</span>
                    <span className={`node-tier ${node.tier.toLowerCase()}`}>{node.tier}</span>
                  </div>
                  <span className={`node-status ${node.isActive ? 'active' : 'inactive'}`}>
                    {node.isActive ? '●' : '○'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
