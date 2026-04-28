// src/app/api/admin/videos/route.js
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

export async function GET(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type    = searchParams.get('type')
    const topicId = searchParams.get('topicId')
    const limit   = parseInt(searchParams.get('limit') || '100')

    const where = {}
    if (type) where.type = type
    if (topicId) where.topicId = topicId

    const videos = await prisma.video.findMany({
      where,
      include: { topic: { select: { id: true, name: true, slug: true } } },
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
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()

    const title          = formData.get('title')?.trim()
    const description    = formData.get('description')?.trim()
    const type           = formData.get('type')           // 'free' | 'premium'
    const topicId        = formData.get('topicId')        // may be empty
    const order          = parseInt(formData.get('order') || '0')
    const showOnHomepage = formData.get('showOnHomepage') === 'true'
    const duration       = formData.get('duration')?.trim()
    const playLimit      = parseInt(formData.get('playLimit') || '3')
    const thumbnailFile  = formData.get('thumbnail')
    const videoFile      = formData.get('video')

    /* ── Validation ── */
    if (!title)         return NextResponse.json({ error: 'Title is required' },     { status: 400 })
    if (!type)          return NextResponse.json({ error: 'Type is required' },      { status: 400 })
    if (!thumbnailFile) return NextResponse.json({ error: 'Thumbnail is required' }, { status: 400 })
    if (!videoFile)     return NextResponse.json({ error: 'Video is required' },     { status: 400 })

    /* ── Upload thumbnail → Cloudinary ── */
    const thumbBuf    = await thumbnailFile.arrayBuffer()
    const thumbBase64 = `data:${thumbnailFile.type};base64,${Buffer.from(thumbBuf).toString('base64')}`
    const { url: thumbnailUrl, publicId: thumbnailPublicId } =
      await uploadImage(thumbBase64, 'ldce/thumbnails')

    /* ── Upload video → Cloudflare R2 ── */
    const videoBuf = Buffer.from(await videoFile.arrayBuffer())
    const { key: videoKey, url: videoUrl } =
      await uploadVideoToR2(videoBuf, videoFile.name, videoFile.type, 'videos')

    /* ── Persist to DB ── */
    const video = await prisma.video.create({
      data: {
        title,
        description:    description || null,
        type,
        topicId:        topicId || null,
        thumbnail:      thumbnailUrl,
        thumbnailPublicId,
        videoUrl,
        videoKey,
        duration:       duration || null,
        order,
        showOnHomepage,
        playLimit,
      },
    })

    return NextResponse.json({ success: true, video: { ...video, _id: video.id } }, { status: 201 })
  } catch (error) {
    console.error('Admin video upload error:', error)
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 })

    const allowed = ['title', 'description', 'type', 'topicId', 'order',
                     'showOnHomepage', 'isActive', 'duration', 'playLimit']
    const data = {}
    allowed.forEach(k => { if (k in updates) data[k] = updates[k] })

    const video = await prisma.video.update({ where: { id }, data })
    return NextResponse.json({ success: true, video: { ...video, _id: video.id } })
  } catch (error) {
    console.error('Admin PATCH video:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Video ID required' }, { status: 400 })

    const video = await prisma.video.findUnique({ where: { id } })
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

    // Delete from R2 and Cloudinary in parallel
    await Promise.allSettled([
      video.videoKey         ? deleteVideoFromR2(video.videoKey)           : Promise.resolve(),
      video.thumbnailPublicId ? deleteImage(video.thumbnailPublicId)        : Promise.resolve(),
    ])

    await prisma.videoPlay.deleteMany({ where: { videoId: id } })
    await prisma.video.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Video deleted successfully' })
  } catch (error) {
    console.error('Admin DELETE video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}