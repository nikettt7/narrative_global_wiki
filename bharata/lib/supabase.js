import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function signUp(email, password, username, role = 'reader') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

// ─── Character helpers ───────────────────────────────────────────────────────

export const DEFAULT_SECTIONS = [
  { key: 'biography',    title: 'Biography',            order: 0 },
  { key: 'physical',     title: 'Physical Description', order: 1 },
  { key: 'personality',  title: 'Personality',          order: 2 },
  { key: 'abilities',    title: 'Abilities & Skills',   order: 3 },
  { key: 'relationships',title: 'Relationships',        order: 4 },
  { key: 'etymology',    title: 'Etymology',            order: 5 },
  { key: 'appearances',  title: 'Appearances',          order: 6 },
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

export async function fetchCharacters() {
  const { data, error } = await supabase
    .from('characters')
    .select('id, name, type, intro, created_at')
    .order('name')
  return { data, error }
}

export async function fetchCharacter(id) {
  const [charRes, sectionsRes, infoboxRes] = await Promise.all([
    supabase.from('characters').select('*').eq('id', id).single(),
    supabase.from('character_sections').select('*').eq('character_id', id).order('display_order'),
    supabase.from('character_infobox').select('*').eq('character_id', id),
  ])
  return {
    character: charRes.data,
    sections: sectionsRes.data || [],
    infobox: infoboxRes.data || [],
    error: charRes.error || sectionsRes.error || infoboxRes.error,
  }
}

export async function createCharacter(name, type, userId) {
  // 1. Insert character
  const { data: char, error: charErr } = await supabase
    .from('characters')
    .insert({ name, type, created_by: userId })
    .select()
    .single()

  if (charErr) return { error: charErr }

  // 2. Insert default sections
  const sections = DEFAULT_SECTIONS.map(s => ({
    character_id: char.id,
    section_key: s.key,
    title: s.title,
    content: '',
    display_order: s.order,
  }))
  await supabase.from('character_sections').insert(sections)

  return { data: char, error: null }
}

export async function updateCharacterBasics(id, fields) {
  const { error } = await supabase
    .from('characters')
    .update(fields)
    .eq('id', id)
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
