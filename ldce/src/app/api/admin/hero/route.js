// src/app/api/admin/hero/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { deleteImage } from '@/lib/cloudinary'
import { deleteVideoFromR2 } from '@/lib/r2'

function requireAdmin(req) {
  const token = req.cookies.get('adminToken')?.value
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.role === 'admin' ? decoded : null
}

export async function GET(req) {
  try {
    const items = await prisma.hero.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
    const mapped = items.map(i => ({ ...i, _id: i.id }))
    return NextResponse.json({ success: true, items: mapped })
  } catch (error) {
    console.error('Hero GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hero content' },
      { status: 500 }
    )
  }
}

// ✅ Now receives JSON (files pre-uploaded from browser)
export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      type = 'image',
      title,
      order = 0,
      // Pre-uploaded data
      mediaUrl,
      mediaPublicId,  // Cloudinary public ID (image/article)
      videoKey,       // R2 key (video)
    } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!mediaUrl) {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 })
    }

    const hero = await prisma.hero.create({
      data: {
        type,
        title: title.trim(),
        subtitle: null,
        mediaUrl,
        mediaPublicId: mediaPublicId || null,
        videoKey: videoKey || null,
        ctaText: null,
        ctaLink: null,
        order: parseInt(order) || 0,
        isActive: true,
      },
    })

    console.log(`✅ Hero slide saved — id: ${hero.id}, type: ${type}`)

    return NextResponse.json(
      { success: true, hero: { ...hero, _id: hero.id } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Hero POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create hero item' },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const hero = await prisma.hero.findUnique({ where: { id } })
    if (!hero) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    await Promise.allSettled([
      hero.type === 'video' && hero.videoKey
        ? deleteVideoFromR2(hero.videoKey)
            .then(() => console.log(`✅ R2 deleted: ${hero.videoKey}`))
            .catch(e => console.warn(`⚠️ R2 delete failed: ${e.message}`))
        : Promise.resolve(),

      hero.type !== 'video' && hero.mediaPublicId
        ? deleteImage(hero.mediaPublicId)
            .then(() => console.log(`✅ Cloudinary deleted: ${hero.mediaPublicId}`))
            .catch(e => console.warn(`⚠️ Cloudinary delete failed: ${e.message}`))
        : Promise.resolve(),
    ])

    await prisma.hero.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hero DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete slide' },
      { status: 500 }
    )
  }
}