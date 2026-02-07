import { useState } from 'react'
import axios from 'axios'

interface LoginProps {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const response = await axios.post(endpoint, { email, password })
      
      if (isRegister) {
        setMessage('注册成功！请登录')
        setIsRegister(false)
      } else {
        onLogin(response.data.token)
      }
    } catch (error: any) {
      setIsError(true)
      setMessage(error.response?.data?.error || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <h1>🦞 小龙虾VPN</h1>
      <p className="subtitle">{isRegister ? '创建新账户' : '登录您的账户'}</p>
      
      {message && (
        <div className={isError ? 'error' : 'success'}>{message}</div>
      )}

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

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
        </button>
      </form>

      <button 
        className="btn btn-secondary"
        onClick={() => {
          setIsRegister(!isRegister)
          setMessage('')
        }}
      >
        {isRegister ? '已有账户？去登录' : '没有账户？去注册'}
      </button>
    </div>
  )
}
