import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function AdminLogin({ goHome }) {
  const { signIn }   = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [busy,     setBusy]     = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="a-login-page">
      <div className="a-login-card">
        <div className="a-login-brand">
          <div className="a-login-logo">JB</div>
          <h1>Admin Portal</h1>
          <p>Jain Bhojanshala Finder</p>
        </div>

        {error && <div className="a-login-error">{error}</div>}

        <form onSubmit={handleLogin} className="a-login-form">
          <div className="a-field">
            <label className="a-label">Email</label>
            <input
              className="a-input" type="email" autoComplete="email"
              placeholder="admin@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div className="a-field">
            <label className="a-label">Password</label>
            <input
              className="a-input" type="password" autoComplete="current-password"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
          </div>
          <button className="a-login-submit" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <button className="a-login-back" onClick={goHome}>← Back to website</button>
      </div>
    </div>
  )
}
