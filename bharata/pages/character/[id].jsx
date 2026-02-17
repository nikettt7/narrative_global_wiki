import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import Infobox from '../../components/Infobox'
import WikiSection from '../../components/WikiSection'
import Toast from '../../components/Toast'
import { useAuth } from '../../lib/authContext'
import {
  fetchCharacters,
  fetchCharacter,
  updateCharacterBasics,
} from '../../lib/supabase'

export default function CharacterPage() {
  const router     = useRouter()
  const { id }     = router.query
  const { isEditor } = useAuth()

  const [characters, setCharacters] = useState([])
  const [character, setCharacter]   = useState(null)
  const [sections, setSections]     = useState([])
  const [infobox, setInfobox]       = useState([])
  const [documents, setDocuments]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [toast, setToast]           = useState(null)

  // Intro editing
  const [editingIntro, setEditingIntro] = useState(false)
  const [introDraft, setIntroDraft]     = useState('')

  // Name editing
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft]     = useState('')

  // ── Load all characters (sidebar) ───────────────────────────────────
  useEffect(() => {
    fetchCharacters().then(({ data }) => setCharacters(data || []))
  }, [])

  // ── Load this character ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchCharacter(id).then(({ character: c, sections: s, infobox: ib, documents: d }) => {
      setCharacter(c)
      setSections(s)
      setInfobox(ib)
      setDocuments(d)
      setIntroDraft(c?.intro || '')
      setNameDraft(c?.name || '')
      setLoading(false)
    })
  }, [id])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
  }

  // ── Save intro ───────────────────────────────────────────────────────
  const handleSaveIntro = async () => {
    const { error } = await updateCharacterBasics(id, { intro: introDraft })
    if (!error) {
      setCharacter(c => ({ ...c, intro: introDraft }))
      setEditingIntro(false)
      showToast('Introduction saved.')
    }
  }

  // ── Save name ────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!nameDraft.trim()) return
    const { error } = await updateCharacterBasics(id, { name: nameDraft.trim() })
    if (!error) {
      setCharacter(c => ({ ...c, name: nameDraft.trim() }))
      setCharacters(prev => prev.map(c => c.id === id ? { ...c, name: nameDraft.trim() } : c))
      setEditingName(false)
      showToast('Name updated.')
    }
  }

  // ── Section saved callback ───────────────────────────────────────────
  const handleSectionSaved = (sectionKey, content) => {
    setSections(prev => prev.map(s => s.section_key === sectionKey ? { ...s, content } : s))
    showToast('Section saved.')
  }

  // ── Search ───────────────────────────────────────────────────────────
  const handleSearch = (q) => {
    router.push(`/?q=${encodeURIComponent(q)}`)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-emblem">भ</div>
        <div className="loading-text">Loading character...</div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="loading-screen">
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Character not found.</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{character.name} — Bhaarat Wiki</title>
      </Head>

      <div className="mandala-bg" />

      <Header onSearch={handleSearch} />

      <div className="wiki-layout">
        <Sidebar
          characters={characters}
          onCharacterAdded={c => setCharacters(prev => [...prev, c])}
        />

        <main className="wiki-main">
          <article className="char-page fade-in">

            {/* ── Page Title ─────────────────────────────────────────── */}
            <div className="page-title-area">
              {editingName ? (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    className="form-input"
                    style={{ fontSize: 24, fontFamily: "'Cinzel', serif", flex: 1 }}
                    value={nameDraft}
                    onChange={e => setNameDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                  />
                  <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 12 }} onClick={handleSaveName}>Save</button>
                  <button className="btn-secondary" style={{ padding: '8px 14px' }} onClick={() => setEditingName(false)}>×</button>
                </div>
              ) : (
                <>
                  <div className="page-title">{character.name}</div>
                  {infobox.find(r => r.field_key === 'titles')?.field_value && (
                    <div className="page-subtitle">
                      {infobox.find(r => r.field_key === 'titles').field_value}
                    </div>
                  )}
                  {isEditor && (
                    <button className="btn-ghost" style={{ position: 'absolute', top: 0, right: 0 }} onClick={() => setEditingName(true)}>
                      ✎ Rename
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ── Intro + Infobox ────────────────────────────────────── */}
            <div className="page-intro-row">
              <div style={{ flex: 1 }}>
                {editingIntro ? (
                  <>
                    <textarea
                      className="section-edit-area"
                      value={introDraft}
                      onChange={e => setIntroDraft(e.target.value)}
                      placeholder="Write a brief introduction about this character..."
                      style={{ minHeight: 160 }}
                    />
                    <div className="edit-controls">
                      <button className="btn-primary" style={{ padding: '7px 20px', fontSize: 12 }} onClick={handleSaveIntro}>Save</button>
                      <button className="btn-secondary" style={{ padding: '7px 14px' }} onClick={() => { setIntroDraft(character.intro || ''); setEditingIntro(false) }}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="page-intro-text">
                    {character.intro
                      ? character.intro.split('\n').map((p, i) => p.trim() ? <p key={i}>{p}</p> : null)
                      : <p className="section-placeholder" style={{ display: 'inline-block', minWidth: 300 }}>
                          {isEditor ? 'Click "Edit Intro" to write an introduction.' : 'Introduction not yet written.'}
                        </p>
                    }
                    {isEditor && (
                      <button className="btn-ghost" style={{ marginTop: 10, display: 'block' }}
                        onClick={() => { setIntroDraft(character.intro || ''); setEditingIntro(true) }}>
                        ✎ Edit Intro
                      </button>
                    )}
                  </div>
                )}
              </div>

              <Infobox
                character={character}
                infoboxData={infobox}
                documents={documents}
                isEditor={isEditor}
                onSaved={(newData) => {
                  setInfobox(Object.entries(newData).map(([k, v]) => ({ field_key: k, field_value: v })))
                  showToast('Infobox saved.')
                }}
                onImageSaved={(url) => setCharacter(c => ({ ...c, image_url: url }))}
              />
            </div>

            {/* ── Table of Contents ──────────────────────────────────── */}
            <div className="toc">
              <div className="toc-title">◈ Contents</div>
              <ol>
                {sections.map(s => (
                  <li key={s.section_key}>
                    <a href={`#${s.section_key}`}>{s.title}</a>
                  </li>
                ))}
              </ol>
            </div>

            <div className="ornament">✦ ✦ ✦</div>

            {/* ── Sections ───────────────────────────────────────────── */}
            {sections.map(section => (
              <WikiSection
                key={section.section_key}
                characterId={id}
                section={section}
                isEditor={isEditor}
                onSaved={handleSectionSaved}
              />
            ))}

          </article>
        </main>
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  )
}
