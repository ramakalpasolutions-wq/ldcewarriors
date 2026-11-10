// src/app/api/media/[...key]/route.js
// Serves site images and documents stored in R2 under "media/".
// Redirects to a short-lived signed link; class videos and quiz
// media live in other folders and can never be fetched here.
import { NextResponse } from 'next/server'
import { isMediaKey, signedMediaUrl } from '@/lib/media'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const { key: parts } = await params
  const key = (parts || []).join('/')

  if (!isMediaKey(key)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    // Link valid 24h; browsers/CDNs may reuse this redirect for 12h
    const url = await signedMediaUrl(key, 24 * 60 * 60)
    return NextResponse.redirect(url, {
      status: 302,
      headers: { 'Cache-Control': 'public, max-age=43200' },
    })
  } catch (error) {
    console.error('Media route error:', error.message)
    return NextResponse.json({ error: 'Unable to load file' }, { status: 500 })
  }
}
