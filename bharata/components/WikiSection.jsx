import { useState } from 'react'
import { upsertSection } from '../lib/supabase'

export default function WikiSection({ characterId, section, isEditor, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(section.content || '')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await upsertSection(characterId, section.section_key, draft)
    setSaving(false)
    setEditing(false)
    onSaved?.(section.section_key, draft)
  }

  const handleCancel = () => {
    setDraft(section.content || '')
    setEditing(false)
  }

  return (
    <div className="wiki-section" id={section.section_key}>
      <div className="section-heading">
        <div className="section-heading-left">{section.title}</div>
        {isEditor && !editing && (
          <button className="btn-ghost" onClick={() => { setDraft(section.content || ''); setEditing(true) }}>
            ✎ Edit
          </button>
        )}
      </div>

      <div className="section-content">
        {editing ? (
          <>
            <textarea
              className="section-edit-area"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={`Write the ${section.title.toLowerCase()} here...`}
            />
            <div className="edit-controls">
              <button className="btn-primary" style={{ padding: '7px 20px', fontSize: 12 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="btn-secondary" style={{ padding: '7px 16px' }} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </>
        ) : section.content ? (
          <div>
            {section.content.split('\n').map((p, i) =>
              p.trim() ? <p key={i}>{p}</p> : null
            )}
          </div>
        ) : (
          <div className="section-placeholder">
            {isEditor
              ? `Click "Edit" to add ${section.title.toLowerCase()} content.`
              : `${section.title} has not been written yet.`}
          </div>
        )}
      </div>
    </div>
  )
}
