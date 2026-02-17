import { useState, useRef } from 'react'
import {
  INFOBOX_FIELDS,
  upsertInfoboxField,
  uploadCharacterImage,
  removeCharacterImage,
  addDocument,
  updateDocument,
  deleteDocument,
} from '../lib/supabase'

// ── Infobox field row ────────────────────────────────────────────────────────
function InfoboxRow({ label, fieldKey, value, editing, onChange }) {
  return (
    <div className="infobox-row">
      <span className="infobox-label">{label}</span>
      {editing ? (
        <input
          className="inline-edit"
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          placeholder="—"
        />
      ) : (
        <span className={`infobox-value ${!value ? 'empty' : ''}`}>{value || '—'}</span>
      )}
    </div>
  )
}

// ── Image section ────────────────────────────────────────────────────────────
function ImageSection({ character, isEditor, onImageSaved }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef                   = useRef()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }

    setUploading(true); setError('')
    const { url, error: err } = await uploadCharacterImage(character.id, file)
    setUploading(false)

    if (err) { setError('Upload failed. Try again.'); return }
    onImageSaved?.(url)
  }

  const handleRemove = async () => {
    if (!confirm('Remove this image?')) return
    await removeCharacterImage(character.id, character.image_url)
    onImageSaved?.(null)
  }

  return (
    <div style={{ position: 'relative', borderBottom: '1px solid var(--border)' }}>
      {character.image_url ? (
        <>
          <img
            src={character.image_url}
            alt={character.name}
            className="infobox-image"
          />
          {isEditor && (
            <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: 'var(--bg-card)' }}>
              <button
                className="btn-ghost"
                style={{ flex: 1, fontSize: 11 }}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : '↑ Replace Image'}
              </button>
              <button
                className="btn-ghost btn-danger"
                style={{ fontSize: 11 }}
                onClick={handleRemove}
              >
                ✕
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="infobox-image-placeholder">
          <div className="placeholder-symbol">{character.name.charAt(0)}</div>
          <div className="placeholder-text">No image yet</div>
          {isEditor && (
            <button
              className="btn-ghost"
              style={{ marginTop: 10, fontSize: 11 }}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : '+ Upload Image'}
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{ padding: '6px 12px', color: 'var(--crimson-bright)', fontSize: 12 }}>⚠ {error}</div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}

// ── Documents section ────────────────────────────────────────────────────────
function DocumentsSection({ characterId, documents: initialDocs, isEditor }) {
  const [docs, setDocs]       = useState(initialDocs || [])
  const [adding, setAdding]   = useState(false)
  const [editId, setEditId]   = useState(null)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl]   = useState('')
  const [saving, setSaving]   = useState(false)

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return
    setSaving(true)
    const url = newUrl.startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`
    const { data, error } = await addDocument(characterId, newName.trim(), url, docs.length)
    setSaving(false)
    if (!error && data) {
      setDocs(prev => [...prev, data])
      setNewName(''); setNewUrl(''); setAdding(false)
    }
  }

  const handleUpdate = async (doc) => {
    if (!doc.doc_name.trim() || !doc.doc_url.trim()) return
    setSaving(true)
    await updateDocument(doc.id, doc.doc_name, doc.doc_url)
    setSaving(false)
    setEditId(null)
  }

  const handleDelete = async (docId) => {
    if (!confirm('Remove this document?')) return
    await deleteDocument(docId)
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  const handleEditChange = (id, field, value) => {
    setDocs(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  return (
    <div>
      <div className="infobox-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>External Documents</span>
        {isEditor && !adding && (
          <button
            onClick={() => setAdding(true)}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
          >
            +
          </button>
        )}
      </div>

      {/* Document list */}
      {docs.length === 0 && !adding && (
        <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>
          {isEditor ? 'No documents yet. Click + to add.' : 'No documents attached.'}
        </div>
      )}

      {docs.map(doc => (
        <div key={doc.id} style={{ borderBottom: '1px solid rgba(58,46,30,0.5)' }}>
          {editId === doc.id && isEditor ? (
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <input
                className="inline-edit"
                value={doc.doc_name}
                onChange={e => handleEditChange(doc.id, 'doc_name', e.target.value)}
                placeholder="Document name"
              />
              <input
                className="inline-edit"
                value={doc.doc_url}
                onChange={e => handleEditChange(doc.id, 'doc_url', e.target.value)}
                placeholder="https://..."
              />
              <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                <button className="btn-primary" style={{ flex: 1, padding: '5px', fontSize: 11 }} onClick={() => handleUpdate(doc)} disabled={saving}>
                  {saving ? '...' : 'Save'}
                </button>
                <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px', gap: 6 }}>
              <span style={{ fontSize: 13 }}>📄</span>
              <a
                href={doc.doc_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, fontSize: 13, color: 'var(--gold-light)', textDecoration: 'none', wordBreak: 'break-word' }}
                title={doc.doc_url}
              >
                {doc.doc_name}
              </a>
              {isEditor && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => setEditId(doc.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--crimson)', cursor: 'pointer', fontSize: 12 }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add new document form */}
      {adding && isEditor && (
        <div style={{ padding: '8px 10px', borderTop: '1px dashed var(--border-bright)', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <input
            className="inline-edit"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Document name..."
            autoFocus
          />
          <input
            className="inline-edit"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
            <button className="btn-primary" style={{ flex: 1, padding: '5px', fontSize: 11 }} onClick={handleAdd} disabled={saving}>
              {saving ? '...' : 'Add Document'}
            </button>
            <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => { setAdding(false); setNewName(''); setNewUrl('') }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Infobox ─────────────────────────────────────────────────────────────
export default function Infobox({ character, infoboxData, documents, isEditor, onSaved, onImageSaved }) {
  const dataMap = Object.fromEntries((infoboxData || []).map(r => [r.field_key, r.field_value]))

  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({ ...dataMap })
  const [saving, setSaving]   = useState(false)
  const [imgSrc, setImgSrc]   = useState(character.image_url || null)

  const handleChange = (key, val) => setDraft(d => ({ ...d, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    const allKeys = Object.values(INFOBOX_FIELDS).flat().map(f => f.key)
    await Promise.all(allKeys.map(key => upsertInfoboxField(character.id, key, draft[key] || '')))
    setSaving(false)
    setEditing(false)
    onSaved?.({ ...draft })
  }

  const handleImageSaved = (url) => {
    setImgSrc(url)
    onImageSaved?.(url)
  }

  const displayData = editing ? draft : dataMap

  const renderSection = (title, fields) => (
    <>
      <div className="infobox-section-label">{title}</div>
      {fields.map(f => (
        <InfoboxRow
          key={f.key} label={f.label} fieldKey={f.key}
          value={displayData[f.key] || ''} editing={editing} onChange={handleChange}
        />
      ))}
    </>
  )

  return (
    <div className="infobox">
      <div className="infobox-header">{character.name}</div>

      {/* Image */}
      <ImageSection
        character={{ ...character, image_url: imgSrc }}
        isEditor={isEditor}
        onImageSaved={handleImageSaved}
      />

      {/* Infobox edit controls */}
      {isEditor && (
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
          {editing ? (
            <>
              <button className="btn-primary" style={{ flex: 1, padding: '6px', fontSize: 11 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Infobox'}
              </button>
              <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => { setDraft({ ...dataMap }); setEditing(false) }}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn-ghost" style={{ width: '100%' }} onClick={() => { setDraft({ ...dataMap }); setEditing(true) }}>
              ✎ Edit Infobox
            </button>
          )}
        </div>
      )}

      {renderSection('Biographical',           INFOBOX_FIELDS.biographical)}
      {renderSection('Physical',               INFOBOX_FIELDS.physical)}
      {renderSection('Relationships',          INFOBOX_FIELDS.relationships)}
      {renderSection('Magical Characteristics',INFOBOX_FIELDS.magical)}
      {renderSection('Affiliation',            INFOBOX_FIELDS.affiliation)}

      {/* External Documents */}
      <DocumentsSection
        characterId={character.id}
        documents={documents}
        isEditor={isEditor}
      />
    </div>
  )
}
