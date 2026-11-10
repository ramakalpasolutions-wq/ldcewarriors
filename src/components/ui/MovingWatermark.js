'use client'

import { useEffect, useState } from 'react'

/*
  Viewer watermark (used by the textbook reader): the reader's name and email.
  Screenshots and screen recordings can't be blocked on phones,
  so every capture shows who made it.

  - One label that moves to a new spot every few seconds
    (so it can't be cropped out of a recording)
  - A faint repeating pattern across the whole area
*/

function tileDataUri(text, dark) {
  const fill = dark ? 'rgba(255,255,255,0.10)' : 'rgba(27,42,74,0.07)'
  const safe = String(text).replace(/[<>&"']/g, '')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200">` +
    `<text x="170" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" ` +
    `fill="${fill}" transform="rotate(-24 170 100)">${safe}</text></svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}

/*
  mode="overlay" — fills its positioned parent (e.g. the video box)
  mode="page"    — covers the whole screen (quiz, answer key)
  dark           — light text for dark backgrounds (video)
*/
export default function MovingWatermark({ text, mode = 'overlay', dark = false, zIndex = 6 }) {
  const [pos, setPos] = useState({ x: 30, y: 30 })

  useEffect(() => {
    if (!text) return
    const move = () => setPos({ x: 12 + Math.random() * 76, y: 12 + Math.random() * 76 })
    move()
    const timer = setInterval(move, 4000)
    return () => clearInterval(timer)
  }, [text])

  if (!text) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: mode === 'page' ? 'fixed' : 'absolute',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        userSelect: 'none',
        overflow: 'hidden',
        backgroundImage: tileDataUri(text, dark),
        backgroundRepeat: 'repeat',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: 'translate(-50%, -50%) rotate(-12deg)',
          transition: 'left 2.5s ease-in-out, top 2.5s ease-in-out',
          whiteSpace: 'nowrap',
          fontWeight: 800,
          fontSize: 'clamp(12px, 2.2vw, 17px)',
          letterSpacing: '0.4px',
          color: dark ? 'rgba(255,255,255,0.42)' : 'rgba(27,42,74,0.20)',
          textShadow: dark ? '0 1px 2px rgba(0,0,0,0.45)' : 'none',
        }}
      >
        {text}
      </span>
    </div>
  )
}
