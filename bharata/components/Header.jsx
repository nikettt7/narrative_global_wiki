import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/authContext'
import { signOut } from '../lib/supabase'
import AuthModal from './AuthModal'

export default function Header({ onSearch }) {
  const { user, profile } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <>
      <header className="wiki-header">
        <Link href="/" className="logo-area" style={{ textDecoration: 'none' }}>
          <div className="logo-emblem">भ</div>
          <div>
            <div className="logo-text">Bhaarat Wiki</div>
            <div className="logo-sub">The Age of Bhaarat · Character Compendium</div>
          </div>
        </Link>

        <div className="header-search">
          <span className="search-icon">⌕</span>
          <input
            placeholder="Search characters..."
            onChange={e => onSearch?.(e.target.value)}
          />
        </div>

        <div className="header-right">
          {user && profile ? (
            <>
              <div className="user-badge">
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{profile.username}</span>
                <span className={`badge-role ${profile.role}`}>{profile.role}</span>
              </div>
              <button className="btn-sm danger" onClick={handleLogout}>Leave</button>
            </>
          ) : (
            <button className="btn-primary" style={{ padding: '6px 20px', fontSize: 12 }} onClick={() => setShowAuth(true)}>
              Enter
            </button>
          )}
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
