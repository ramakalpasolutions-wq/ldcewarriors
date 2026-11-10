// src/app/api/admin/about/route.js — load / save About Us content (admin only)
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { loadAbout, loadLiveCounts, saveAbout } from '@/lib/aboutData'
import { DEFAULT_ABOUT, normalizeAbout } from '@/lib/aboutContent'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const [about, counts] = await Promise.all([loadAbout(), loadLiveCounts()])
  return NextResponse.json({
    success: true,
    about,
    counts,
    defaults: normalizeAbout(DEFAULT_ABOUT),
  })
}

export async function PUT(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const about = await saveAbout(body?.about)
    return NextResponse.json({ success: true, about })
  } catch (error) {
    console.error('About save error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 })
  }
}
