import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function signUp(email, password, username, role = 'reader') {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { username, role } },
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return { data, error }
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_SECTIONS = [
  { key: 'biography',     title: 'Biography',            order: 0 },
  { key: 'physical',      title: 'Physical Description', order: 1 },
  { key: 'personality',   title: 'Personality',          order: 2 },
  { key: 'abilities',     title: 'Abilities & Skills',   order: 3 },
  { key: 'relationships', title: 'Relationships',        order: 4 },
  { key: 'etymology',     title: 'Etymology',            order: 5 },
  { key: 'appearances',   title: 'Appearances',          order: 6 },
]

export const INFOBOX_FIELDS = {
  biographical: [
    { key: 'born',       label: 'Born' },
    { key: 'died',       label: 'Died' },
    { key: 'age',        label: 'Age' },
    { key: 'nicknames',  label: 'Nicknames' },
    { key: 'birthplace', label: 'Birthplace' },
    { key: 'status',     label: 'Status' },
  ],
  physical: [
    { key: 'species', label: 'Species' },
    { key: 'gender',  label: 'Gender' },
    { key: 'height',  label: 'Height' },
    { key: 'eyes',    label: 'Eye Colour' },
    { key: 'hair',    label: 'Hair Colour' },
    { key: 'build',   label: 'Build' },
  ],
  relationships: [
    { key: 'family',  label: 'Family' },
    { key: 'allies',  label: 'Allies' },
    { key: 'enemies', label: 'Enemies' },
    { key: 'master',  label: 'Master / Guru' },
    { key: 'lover',   label: 'Beloved' },
  ],
  magical: [
    { key: 'divinity', label: 'Divinity' },
    { key: 'weapon',   label: 'Weapon(s)' },
    { key: 'powers',   label: 'Powers' },
    { key: 'astra',    label: 'Astra' },
    { key: 'vahan',    label: 'Vahan (Mount)' },
  ],
  affiliation: [
    { key: 'allegiance', label: 'Allegiance' },
    { key: 'faction',    label: 'Faction' },
    { key: 'titles',     label: 'Titles' },
    { key: 'position',   label: 'Position' },
  ],
}

// ─── Characters ──────────────────────────────────────────────────────────────

export async function fetchCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, type, intro, image_url, created_at')
    .order('name')
  return { data, error }
}

export async function fetchCharacter(id) {
  const [charRes, sectionsRes, infoboxRes, docsRes] = await Promise.all([
    supabase.from('characters').select('*').eq('id', id).single(),
    supabase.from('character_sections').select('*').eq('character_id', id).order('display_order'),
    supabase.from('character_infobox').select('*').eq('character_id', id),
    supabase.from('character_documents').select('*').eq('character_id', id).order('display_order'),
  ])
  return {
    character: charRes.data,
    sections:  sectionsRes.data || [],
    infobox:   infoboxRes.data  || [],
    documents: docsRes.data     || [],
    error: charRes.error || sectionsRes.error || infoboxRes.error || docsRes.error,
  }
}

export async function createCharacter(name, type, userId) {
  const { data: char, error: charErr } = await supabase
    .from('characters')
    .insert({ name, type, created_by: userId })
    .select()
    .single()

  if (charErr) return { error: charErr }

  const sections = DEFAULT_SECTIONS.map(s => ({
    character_id: char.id, section_key: s.key,
    title: s.title, content: '', display_order: s.order,
  }))
  await supabase.from('character_sections').insert(sections)
  return { data: char, error: null }
}

export async function updateCharacterBasics(id, fields) {
  const { error } = await supabase.from('characters').update(fields).eq('id', id)
  return { error }
}

export async function upsertSection(characterId, sectionKey, content) {
  const { error } = await supabase
    .from('character_sections')
    .update({ content })
    .eq('character_id', characterId)
    .eq('section_key', sectionKey)
  return { error }
}

export async function upsertInfoboxField(characterId, fieldKey, fieldValue) {
  const { error } = await supabase
    .from('character_infobox')
    .upsert(
      { character_id: characterId, field_key: fieldKey, field_value: fieldValue },
      { onConflict: 'character_id,field_key' }
    )
  return { error }
}

// ─── Image upload ─────────────────────────────────────────────────────────────

export async function uploadCharacterImage(characterId, file) {
  const ext      = file.name.split('.').pop()
  const filePath = `${characterId}/portrait.${ext}`

  await supabase.storage.from('character-images').remove([filePath])

  const { error: uploadErr } = await supabase.storage
    .from('character-images')
    .upload(filePath, file, { upsert: true, contentType: file.type })

  if (uploadErr) return { error: uploadErr }

  const { data } = supabase.storage.from('character-images').getPublicUrl(filePath)
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  const { error: updateErr } = await updateCharacterBasics(characterId, { image_url: publicUrl })
  return { url: publicUrl, error: updateErr }
}

export async function removeCharacterImage(characterId, imageUrl) {
  const parts    = imageUrl.split('/character-images/')
  const filePath = parts[1]?.split('?')[0]
  if (filePath) await supabase.storage.from('character-images').remove([filePath])
  return await updateCharacterBasics(characterId, { image_url: null })
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function addDocument(characterId, docName, docUrl, order = 0) {
  const { data, error } = await supabase
    .from('character_documents')
    .insert({ character_id: characterId, doc_name: docName, doc_url: docUrl, display_order: order })
    .select()
    .single()
  return { data, error }
}

export async function updateDocument(docId, docName, docUrl) {
  const { error } = await supabase
    .from('character_documents')
    .update({ doc_name: docName, doc_url: docUrl })
    .eq('id', docId)
  return { error }
}

export async function deleteDocument(docId) {
  const { error } = await supabase.from('character_documents').delete().eq('id', docId)
  return { error }
}
