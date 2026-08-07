import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import { TerminalWindow } from '@phosphor-icons/react'
import './AuthPages.css'

export default function LoginPage() {
  const { login, demoLogin } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()
  
  const [form, setForm]       = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    try {
      await demoLogin()
      navigate('/dashboard')
    } catch (err) {
      toast.error('Demo login failed')
    } finally {
      setDemoLoading(false)
    }
  }

  // Auto-trigger demo login if query param ?demo=true is present
  useEffect(() => {
    if (new URLSearchParams(location.search).get('demo') === 'true') {
      handleDemoLogin()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card animate-fade-in">
        
        <div className="auth-header">
          <div className="auth-brand">
            <TerminalWindow size={32} weight="duotone" />
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue your practice.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required 
            />
          </div>
          <button type="submit" className="btn btn-secondary auth-btn" disabled={loading || demoLoading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
          <button type="button" className="btn btn-primary auth-btn mt-2" disabled={loading || demoLoading} onClick={handleDemoLogin}>
            {demoLoading ? <span className="spinner" /> : 'Try Demo Experience'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? 
          <Link to="/register" className="auth-link">Create one</Link>
        </div>
      </div>
    </div>
  )
}
