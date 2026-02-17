import { useState } from 'react'
import { INFOBOX_FIELDS, upsertInfoboxField } from '../lib/supabase'

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

export default function Infobox({ character, infoboxData, isEditor, onSaved }) {
  // infoboxData is array of { field_key, field_value }
  const dataMap = Object.fromEntries((infoboxData || []).map(r => [r.field_key, r.field_value]))

  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState({ ...dataMap })
  const [saving, setSaving]     = useState(false)

  const handleChange = (key, val) => setDraft(d => ({ ...d, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    const allKeys = Object.values(INFOBOX_FIELDS).flat().map(f => f.key)
    await Promise.all(
      allKeys.map(key => upsertInfoboxField(character.id, key, draft[key] || ''))
    )
    setSaving(false)
    setEditing(false)
    onSaved?.({ ...draft })
  }

  const displayData = editing ? draft : dataMap

  const renderSection = (title, fields) => (
    <>
      <div className="infobox-section-label">{title}</div>
      {fields.map(f => (
        <InfoboxRow
          key={f.key}
          label={f.label}
          fieldKey={f.key}
          value={displayData[f.key] || ''}
          editing={editing}
          onChange={handleChange}
        />
      ))}
    </>
  )

  return (
    <div className="infobox">
      <div className="infobox-header">{character.name}</div>

      {/* Image placeholder */}
      <div className="infobox-image-placeholder">
        <div className="placeholder-symbol">{character.name.charAt(0)}</div>
        <div className="placeholder-text">No image yet</div>
      </div>

      {/* Edit controls */}
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

      {renderSection('Biographical', INFOBOX_FIELDS.biographical)}
      {renderSection('Physical', INFOBOX_FIELDS.physical)}
      {renderSection('Relationships', INFOBOX_FIELDS.relationships)}
      {renderSection('Magical Characteristics', INFOBOX_FIELDS.magical)}
      {renderSection('Affiliation', INFOBOX_FIELDS.affiliation)}
    </div>
  )
}
