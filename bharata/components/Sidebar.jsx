import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/authContext'
import { createCharacter } from '../lib/supabase'

export default function Sidebar({ characters, onCharacterAdded }) {
  const { user, profile, isEditor } = useAuth()
  const router = useRouter()
  const activeId = router.query.id

  const [showNew, setShowNew]   = useState(false)
  const [name, setName]         = useState('')
  const [type, setType]         = useState('')
  const [loading, setLoading]   = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { data, error } = await createCharacter(name.trim(), type.trim() || 'Character', user.id)
    setLoading(false)
    if (!error && data) {
      onCharacterAdded?.(data)
      setName(''); setType(''); setShowNew(false)
      router.push(`/character/${data.id}`)
    }
  }

  return (
    <nav className="wiki-sidebar">
      <div className="sidebar-section-title">✦ Characters</div>

      <div className="char-list">
        {characters.length === 0 && (
          <div className="sidebar-empty">
            {isEditor ? 'Add your first character below.' : 'No characters yet.'}
          </div>
        )}
        {characters.map(c => (
          <Link
            key={c.id}
            href={`/character/${c.id}`}
            className={`char-list-item ${activeId === c.id ? 'active' : ''}`}
          >
            <div className="char-avatar">{c.name.charAt(0)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="char-name-sidebar">{c.name}</div>
              <div className="char-type-sidebar">{c.type}</div>
            </div>
          </Link>
        ))}
      </div>

      {isEditor && (
        <div style={{ flexShrink: 0 }}>
          {showNew ? (
            <div style={{ padding: '12px' }}>
              <input
                className="form-input"
                placeholder="Character name..."
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ marginBottom: 8, fontSize: 14 }}
                autoFocus
              />
              <input
                className="form-input"
                placeholder="Type (e.g. Deva, Rakshasa...)"
                value={type}
                onChange={e => setType(e.target.value)}
                style={{ marginBottom: 8, fontSize: 14 }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-primary" style={{ flex: 1, padding: '7px', fontSize: 11 }} onClick={handleAdd} disabled={loading}>
                  {loading ? '...' : 'Create'}
                </button>
                <button className="btn-secondary" style={{ padding: '7px 12px', fontSize: 13 }} onClick={() => setShowNew(false)}>✕</button>
              </div>
            </div>
          ) : (
            <button className="sidebar-add-btn" onClick={() => setShowNew(true)}>
              + New Character
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
