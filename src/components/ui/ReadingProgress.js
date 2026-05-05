// src/components/ui/ReadingProgress.js
'use client'
import { useEffect, useState } from 'react'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      setProgress(Math.min(100, (scrollTop / docHeight) * 100))
    }

    window.addEventListener('scroll', update, { passive: true })
    update()

    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      zIndex: 200,
      background: 'rgba(27, 42, 74, 0.08)',
    }}>
      <div style={{
        height: '100%',
        background: 'linear-gradient(90deg, #1B2A4A, #E8A838)',
        width: `${progress}%`,
        transition: 'width 0.1s linear',
      }} />
    </div>
  )
}