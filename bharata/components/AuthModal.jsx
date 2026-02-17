import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function AuthModal({ onClose }) {
  const [tab, setTab]           = useState('signin')  // 'signin' | 'signup'
  const [role, setRole]         = useState('reader')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please fill all fields.'); return }
    setLoading(true); setError('')
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    onClose?.()
  }

  const handleSignUp = async () => {
    if (!username || !email || !password) { setError('Please fill all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    const { error: err } = await signUp(email, password, username, role)
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Account created! Check your email to confirm, then sign in.')
    setTab('signin')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-box fade-in" style={{ width: 440 }}>
        <div className="modal-header">
          <div className="modal-emblem">भ</div>
          <div className="modal-title">Bhaarat Wiki</div>
          <div className="modal-subtitle">The Age of Bhaarat · Character Compendium</div>
        </div>

        <div className="modal-body">
          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'signin' ? 'active' : ''}`} onClick={() => { setTab('signin'); setError(''); setSuccess(''); }}>
              Sign In
            </button>
            <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}>
              Create Account
            </button>
          </div>

          {success && (
            <div style={{ background: 'rgba(201,148,42,0.08)', border: '1px solid var(--gold)', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--gold-light)' }}>
              ✦ {success}
            </div>
          )}

          {/* Sign In */}
          {tab === 'signin' && (
            <>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} />
              </div>
              {error && <div className="form-error" style={{ marginBottom: 12 }}>⚠ {error}</div>}
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleSignIn} disabled={loading}>
                {loading ? 'Entering...' : 'Enter the World'}
              </button>
            </>
          )}

          {/* Sign Up */}
          {tab === 'signup' && (
            <>
              <div className="role-selector">
                <div className={`role-card ${role === 'reader' ? 'selected' : ''}`} onClick={() => setRole('reader')}>
                  <div className="role-icon">📖</div>
                  <div className="role-name">Reader</div>
                  <div className="role-desc">Explore the lore</div>
                </div>
                <div className={`role-card editor-card ${role === 'editor' ? 'selected' : ''}`} onClick={() => setRole('editor')}>
                  <div className="role-icon">✍️</div>
                  <div className="role-name">Editor</div>
                  <div className="role-desc">Craft the lore</div>
                </div>
              </div>

              {role === 'editor' && (
                <div style={{ background: 'rgba(139,26,26,0.1)', border: '1px solid var(--crimson)', borderRadius: 4, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                  ⚠ Editor accounts require admin approval. Contact the wiki admin after signing up.
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input className="form-input" placeholder="Warrior name..." value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignUp()} />
              </div>
              {error && <div className="form-error" style={{ marginBottom: 12 }}>⚠ {error}</div>}
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleSignUp} disabled={loading}>
                {loading ? 'Creating account...' : 'Join the Compendium'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
