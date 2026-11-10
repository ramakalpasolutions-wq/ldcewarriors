'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import TextbookCard, { textbookStyles } from '@/components/materials/TextbookCard'

export default function TopicTextbooksPage() {
  const { id } = useParams()
  const [topic, setTopic] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/materials?topic=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (!data.success) throw new Error(data.error)
        setTopic(data.topic)
        setMaterials(data.materials)
      })
      .catch(err => !cancelled && setError(err.message || 'Unable to load textbooks right now.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [id])

  return (
    <>
      <Navbar />
      <main className="mat-page">
        <header className="mat-hero">
          <Link href="/materials" className="mat-back">← All topics</Link>
          <h1>{topic?.name || 'Digital Textbook'}</h1>
          <p>{topic?.description || 'Chapter-wise textbooks. Read anytime, anywhere.'}</p>
        </header>

        {loading ? (
          <div className="mat-grid">
            {[1, 2, 3].map(i => <div key={i} className="mat-card mat-skeleton" />)}
          </div>
        ) : error ? (
          <p className="mat-empty">{error}</p>
        ) : materials.length === 0 ? (
          <p className="mat-empty">Textbooks for this topic are coming soon. Stay tuned!</p>
        ) : (
          <div className="mat-grid">
            {materials.map(m => <TextbookCard key={m.id} material={m} />)}
          </div>
        )}
      </main>
      <Footer />
      <style>{textbookStyles}</style>
    </>
  )
}
