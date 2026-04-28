// src/app/api/admin/hero/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { uploadImage, deleteImage } from '@/lib/cloudinary'
import { uploadVideoToR2, deleteVideoFromR2 } from '@/lib/r2'

function requireAdmin(req) {
  const token = req.cookies.get('adminToken')?.value
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.role === 'admin' ? decoded : null
}

/* ── Upload image → Cloudinary ── */
async function uploadImageToCloudinary(file, folder) {
  const buffer  = await file.arrayBuffer()
  const base64  = `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`
  const result  = await uploadImage(base64, folder)
  return { url: result.url, publicId: result.publicId }
}

/* ═══════════════════════════════════════════════
   GET  /api/admin/hero
═══════════════════════════════════════════════ */
export async function GET(req) {
  try {
    const items = await prisma.hero.findMany({
      where:   { isActive: true },
      orderBy: { order: 'asc' },
    })
    const mapped = items.map(i => ({ ...i, _id: i.id }))
    return NextResponse.json({ success: true, items: mapped })
  } catch (error) {
    console.error('Hero GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch hero content' }, { status: 500 })
  }
}

/* ═══════════════════════════════════════════════
   POST  /api/admin/hero
   image / article  → Cloudinary
   video            → Cloudflare R2
═══════════════════════════════════════════════ */
export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData  = await req.formData()
    const type      = formData.get('type')  || 'image'
    const title     = (formData.get('title') || '').trim()
    const order     = parseInt(formData.get('order') || '0')
    const mediaFile = formData.get('media')

    /* ── Basic validation ── */
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!mediaFile || mediaFile.size === 0) {
      return NextResponse.json({ error: 'Media file is required' }, { status: 400 })
    }

    /* ── Size limits ── */
    const MAX_IMAGE = 10  * 1024 * 1024   // 10 MB
    const MAX_VIDEO = 500 * 1024 * 1024   // 500 MB

    if (type === 'video' && mediaFile.size > MAX_VIDEO) {
      return NextResponse.json({ error: 'Video must be under 500MB' }, { status: 400 })
    }
    if (type !== 'video' && mediaFile.size > MAX_IMAGE) {
      return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 })
    }

    /* ── MIME validation ── */
    const isImageFile = mediaFile.type.startsWith('image/')
    const isVideoFile = mediaFile.type.startsWith('video/')

    if (type === 'video' && !isVideoFile) {
      return NextResponse.json({ error: 'Please upload a valid video file' }, { status: 400 })
    }
    if ((type === 'image' || type === 'article') && !isImageFile) {
      return NextResponse.json({ error: 'Please upload a valid image file' }, { status: 400 })
    }

    /* ── Upload vars ── */
    let mediaUrl      = null
    let mediaPublicId = null   // Cloudinary (image/article)
    let videoKey      = null   // R2 key (video)

    /* ══════════════════════════════════════
       VIDEO → Cloudflare R2
    ══════════════════════════════════════ */
    if (type === 'video') {
      try {
        console.log(`📹 Uploading hero video to R2: ${mediaFile.name} (${(mediaFile.size / 1024 / 1024).toFixed(1)}MB)`)

        const videoBuf = Buffer.from(await mediaFile.arrayBuffer())
        const result   = await uploadVideoToR2(
          videoBuf,
          mediaFile.name,
          mediaFile.type,
          'hero/videos',
        )

        mediaUrl = result.url
        videoKey = result.key
        console.log(`✅ Hero video uploaded to R2 — key: ${videoKey}`)
      } catch (err) {
        console.error('R2 video upload failed:', err)
        return NextResponse.json(
          { error: `Video upload failed: ${err.message}` },
          { status: 500 },
        )
      }
    }

    /* ══════════════════════════════════════
       IMAGE / ARTICLE → Cloudinary
    ══════════════════════════════════════ */
    else {
      try {
        const folder = `ldce/hero/${type}`
        console.log(`🖼️ Uploading hero image to Cloudinary (${folder}): ${mediaFile.name}`)

        const result  = await uploadImageToCloudinary(mediaFile, folder)
        mediaUrl      = result.url
        mediaPublicId = result.publicId
        console.log(`✅ Hero image uploaded to Cloudinary — publicId: ${mediaPublicId}`)
      } catch (err) {
        console.error('Cloudinary image upload failed:', err)
        return NextResponse.json(
          { error: `Image upload failed: ${err.message}` },
          { status: 500 },
        )
      }
    }

    /* ── Persist to DB ── */
    const hero = await prisma.hero.create({
      data: {
        type,
        title,
        subtitle:      null,
        mediaUrl,
        mediaPublicId: mediaPublicId || null,
        videoKey:      videoKey      || null,
        ctaText:       null,
        ctaLink:       null,
        order,
        isActive:      true,
      },
    })

    console.log(`✅ Hero slide saved to DB — id: ${hero.id}, type: ${type}`)

    return NextResponse.json(
      { success: true, hero: { ...hero, _id: hero.id } },
      { status: 201 },
    )
  } catch (error) {
    console.error('Hero POST error:', error)
    return NextResponse.json({ error: 'Failed to create hero item' }, { status: 500 })
  }
}

/* ═══════════════════════════════════════════════
   DELETE  /api/admin/hero?id=xxx
   video  → delete from R2
   image  → delete from Cloudinary
═══════════════════════════════════════════════ */
export async function DELETE(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const hero = await prisma.hero.findUnique({ where: { id } })
    if (!hero) return NextResponse.json({ error: 'Slide not found' }, { status: 404 })

    console.log(`🗑️ Deleting hero slide: ${id} (type=${hero.type})`)

    /* ── Delete media files (non-blocking) ── */
    await Promise.allSettled([

      /* Video → R2 */
      (hero.type === 'video' && hero.videoKey)
        ? deleteVideoFromR2(hero.videoKey)
            .then(()  => console.log(`✅ R2 video deleted: ${hero.videoKey}`))
            .catch(e  => console.warn(`⚠️ R2 delete failed: ${e.message}`))
        : Promise.resolve(),

      /* Image / Article → Cloudinary */
      (hero.type !== 'video' && hero.mediaPublicId)
        ? deleteImage(hero.mediaPublicId)
            .then(()  => console.log(`✅ Cloudinary image deleted: ${hero.mediaPublicId}`))
            .catch(e  => console.warn(`⚠️ Cloudinary delete failed: ${e.message}`))
        : Promise.resolve(),
    ])

    /* ── Delete DB record ── */
    await prisma.hero.delete({ where: { id } })
    console.log(`✅ Hero slide deleted from DB: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hero DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete slide' }, { status: 500 })
  }
}