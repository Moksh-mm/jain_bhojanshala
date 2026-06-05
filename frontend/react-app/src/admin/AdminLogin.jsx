import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function AdminLogin({ goHome }) {
  const { signIn, register } = useAuth()
  const [tab,      setTab]      = useState('login')   // 'login' | 'register'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
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

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setBusy(true)
    try {
      const { user } = await register(email, password)
      if (user) {
        setSuccess('Account created! You can now sign in.')
        setTab('login')
        setPassword('')
      } else {
        setSuccess('Check your email to confirm your account, then sign in.')
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Make sure your email was pre-registered by the Super Admin.')
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

        <div className="a-login-tabs">
          <button
            className={`a-login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); setSuccess('') }}
          >
            Sign In
          </button>
          <button
            className={`a-login-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); setSuccess('') }}
          >
            Register
          </button>
        </div>

        {error   && <div className="a-login-error">{error}</div>}
        {success && <div className="a-login-success">{success}</div>}

        {tab === 'login' ? (
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
        ) : (
          <form onSubmit={handleRegister} className="a-login-form">
            <div className="a-field">
              <label className="a-label">Your Name</label>
              <input
                className="a-input" type="text" autoComplete="name"
                placeholder="Rajesh Shah"
                value={name} onChange={e => setName(e.target.value)} required
              />
            </div>
            <div className="a-field">
              <label className="a-label">Email <span style={{fontSize:11,color:'#64748b'}}>(must match Super Admin invitation)</span></label>
              <input
                className="a-input" type="email" autoComplete="email"
                placeholder="admin@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
            </div>
            <div className="a-field">
              <label className="a-label">Set Password</label>
              <input
                className="a-input" type="password" autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password} onChange={e => setPassword(e.target.value)}
                minLength={8} required
              />
            </div>
            <button className="a-login-submit" type="submit" disabled={busy}>
              {busy ? 'Creating account…' : 'Create Account →'}
            </button>
            <p className="a-login-note">
              Your email must be pre-registered by the Super Admin before you can create an account here.
            </p>
          </form>
        )}

        <button className="a-login-back" onClick={goHome}>← Back to website</button>
      </div>
    </div>
  )
}
