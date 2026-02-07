import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Admin from './pages/Admin'
import './App.css'

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <div className="app">
      <Routes>
        {/* 公开页面 - 营销/下载门户 */}
        <Route path="/" element={<Landing onLogin={handleLogin} />} />
        
        {/* 管理员页面 - 需要登录 */}
        <Route 
          path="/admin" 
          element={token ? <Admin token={token} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        
        {/* 其他路径重定向到首页 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
