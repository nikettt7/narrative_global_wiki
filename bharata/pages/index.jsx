import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { fetchCharacters } from '../lib/supabase'

export default function Home() {
  const [characters, setCharacters] = useState([])
  const [filtered, setFiltered]     = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    loadChars()
  }, [])

  const loadChars = async () => {
    const { data } = await fetchCharacters()
    setCharacters(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  const handleSearch = (query) => {
    const q = query.toLowerCase()
    setFiltered(characters.filter(c =>
      c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
    ))
  }

  const handleCharAdded = (newChar) => {
    setCharacters(prev => [...prev, newChar])
    setFiltered(prev => [...prev, newChar])
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-emblem">भ</div>
        <div className="loading-text">Summoning the Compendium...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Bhaarat Wiki — The Age of Bhaarat</title>
        <meta name="description" content="Official character compendium for The Age of Bhaarat" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="mandala-bg" />

      <Header onSearch={handleSearch} />

      <div className="wiki-layout">
        <Sidebar
          characters={characters}
          onCharacterAdded={handleCharAdded}
        />

        <main className="wiki-main">
          <div className="home-page fade-in">
            {/* Hero */}
            <div className="home-hero">
              <div className="home-hero-title">Bhaarat Wiki</div>
              <div className="home-hero-sub">The Age of Bhaarat · Official Character Compendium</div>
              <div className="home-hero-desc">
                A sacred repository of knowledge on the warriors, devas, rakshasas, and mortals who shape the fate of Anandpur. Written for seekers. Forged in dharma.
              </div>
            </div>

            {/* Character grid */}
            <div className="home-section-title">◈ All Characters</div>
            <div className="chars-grid">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  {characters.length === 0
                    ? 'The compendium awaits its first entry. Sign in as an Editor to begin.'
                    : 'No characters match your search.'}
                </div>
              ) : (
                filtered.map(c => (
                  <Link key={c.id} href={`/character/${c.id}`} className="char-card">
                    <div className="char-card-img">{c.name.charAt(0)}</div>
                    <div className="char-card-body">
                      <div className="char-card-name">{c.name}</div>
                      <div className="char-card-type">{c.type}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
