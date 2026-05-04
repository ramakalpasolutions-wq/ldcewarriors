// src/app/api/admin/videos/route.js
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
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type    = searchParams.get('type')
    const topicId = searchParams.get('topicId')
    const limit   = parseInt(searchParams.get('limit') || '100')

    const where = {}
    if (type) where.type = type
    if (topicId) where.topicId = topicId

    const videos = await prisma.video.findMany({
      where,
      include: {
        topic: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    })

    const mapped = videos.map(v => ({
      ...v,
      _id: v.id,
      topicName: v.topic?.name || null,
    }))

    return NextResponse.json({ success: true, videos: mapped })
  } catch (error) {
    console.error('Admin GET videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

// ✅ Now receives JSON (no file uploads through Vercel)
export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      type,
      topicId,
      order = 0,
      showOnHomepage = false,
      playLimit = 3,
      // Pre-uploaded file data
      thumbnailUrl,
      thumbnailPublicId,
      videoUrl,
      videoKey,
    } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }
    if (!thumbnailUrl) {
      return NextResponse.json({ error: 'Thumbnail is required' }, { status: 400 })
    }
    if (!videoUrl) {
      return NextResponse.json({ error: 'Video is required' }, { status: 400 })
    }

    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        type,
        topicId: topicId || null,
        thumbnail: thumbnailUrl,
        thumbnailPublicId: thumbnailPublicId || null,
        videoUrl,
        videoKey: videoKey || null,
        order: parseInt(order) || 0,
        showOnHomepage: Boolean(showOnHomepage),
        playLimit: parseInt(playLimit) || 3,
      },
    })

    console.log(`✅ Video saved: ${video.id} — ${title}`)

    return NextResponse.json(
      { success: true, video: { ...video, _id: video.id } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin video POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save video' },
      { status: 500 }
    )
  }
}

export async function PATCH(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    const allowed = [
      'title', 'description', 'type', 'topicId', 'order',
      'showOnHomepage', 'isActive', 'duration', 'playLimit',
    ]
    const data = {}
    allowed.forEach(k => {
      if (k in updates) data[k] = updates[k]
    })

    const video = await prisma.video.update({ where: { id }, data })

    return NextResponse.json({
      success: true,
      video: { ...video, _id: video.id },
    })
  } catch (error) {
    console.error('Admin PATCH video:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
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
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    await Promise.allSettled([
      video.videoKey
        ? deleteVideoFromR2(video.videoKey)
        : Promise.resolve(),
      video.thumbnailPublicId
        ? deleteImage(video.thumbnailPublicId)
        : Promise.resolve(),
    ])

    await prisma.videoPlay.deleteMany({ where: { videoId: id } })
    await prisma.video.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    })
  } catch (error) {
    console.error('Admin DELETE video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}