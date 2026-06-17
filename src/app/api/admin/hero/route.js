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

// ✅ Receives JSON (files pre-uploaded from browser)
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
      mediaUrl,
      mediaPublicId,
      videoKey,
    } = body

    // if (!title?.trim()) {
    //   return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    // }
    if (!mediaUrl) {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 })
    }

    const hero = await prisma.hero.create({
      data: {
        type,
        title: title?.trim() || '',
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

// ✅ NEW: PUT method for editing hero slides
export async function PUT(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      id,
      type,
      title,
      order,
      isActive,
      // New media (optional — only if user replaced the file)
      mediaUrl,
      mediaPublicId,
      videoKey,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Fetch existing slide to compare
    const existing = await prisma.hero.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 })
    }

    // if (title !== undefined && !title.trim()) {
    //   return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    // }

    // If media changed, delete old media from cloud storage
    if (mediaUrl && mediaUrl !== existing.mediaUrl) {
      await Promise.allSettled([
        existing.type === 'video' && existing.videoKey
          ? deleteVideoFromR2(existing.videoKey)
              .then(() => console.log(`✅ Old R2 video deleted: ${existing.videoKey}`))
              .catch(e => console.warn(`⚠️ R2 delete failed: ${e.message}`))
          : Promise.resolve(),

        existing.type !== 'video' && existing.mediaPublicId
          ? deleteImage(existing.mediaPublicId)
              .then(() => console.log(`✅ Old Cloudinary image deleted: ${existing.mediaPublicId}`))
              .catch(e => console.warn(`⚠️ Cloudinary delete failed: ${e.message}`))
          : Promise.resolve(),
      ])
    }

    // Build update data — only include fields that are provided
    const updateData = {}
    if (type !== undefined)     updateData.type = type
    if (title !== undefined)    updateData.title = title?.trim() || ''
    if (order !== undefined)    updateData.order = parseInt(order) || 0
    if (isActive !== undefined) updateData.isActive = isActive

    // Update media only if new media uploaded
    if (mediaUrl) {
      updateData.mediaUrl = mediaUrl
      updateData.mediaPublicId = mediaPublicId || null
      updateData.videoKey = videoKey || null
    }

    const updated = await prisma.hero.update({
      where: { id },
      data: updateData,
    })

    console.log(`✅ Hero slide updated — id: ${id}`)

    return NextResponse.json({
      success: true,
      hero: { ...updated, _id: updated.id },
    })
  } catch (error) {
    console.error('Hero PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update slide' },
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