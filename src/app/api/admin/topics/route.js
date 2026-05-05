// src/app/api/admin/topics/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function requireAdmin(req) {
  const token = req.cookies.get('adminToken')?.value
  if (!token) return null
  const decoded = verifyToken(token)
  return decoded?.role === 'admin' ? decoded : null
}

export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    const videoCounts = await prisma.video.groupBy({
      by: ['topicId'],
      where: { isActive: true, topicId: { not: null } },
      _count: { id: true },
    })

    const countMap = {}
    videoCounts.forEach(vc => {
      if (vc.topicId) countMap[vc.topicId] = vc._count.id
    })

    const enriched = topics.map(t => ({
      ...t,
      _id: t.id,
      videoCount: countMap[t.id] || 0,
    }))

    return NextResponse.json({ success: true, topics: enriched })
  } catch (error) {
    console.error('Fetch topics error:', error)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, description, order, thumbnail, thumbnailPublicId } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const existing = await prisma.topic.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Topic with this name already exists' }, { status: 409 })
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        description: description || null,
        slug,
        order: order || 0,
        thumbnail: thumbnail || null,
        thumbnailPublicId: thumbnailPublicId || null,
      },
    })

    return NextResponse.json(
      { success: true, topic: { ...topic, _id: topic.id, videoCount: 0 } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create topic error:', error)
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, name, description, order, thumbnail, thumbnailPublicId, oldPublicId } =
      await req.json()

    if (!id) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 })

    if (oldPublicId && thumbnailPublicId !== oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId)
      } catch (err) {
        console.error('Failed to delete old thumbnail:', err)
      }
    }

    const updateData = {}
    if (name !== undefined) {
      updateData.name = name
      updateData.slug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    }
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = order
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (thumbnailPublicId !== undefined) updateData.thumbnailPublicId = thumbnailPublicId

    const topic = await prisma.topic.update({ where: { id }, data: updateData })

    return NextResponse.json({ success: true, topic: { ...topic, _id: topic.id } })
  } catch (error) {
    console.error('Update topic error:', error)
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderedIds } = await req.json()
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds array required' }, { status: 400 })
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.topic.update({ where: { id }, data: { order: index } })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder topics error:', error)
    return NextResponse.json({ error: 'Failed to reorder topics' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 })

    const topic = await prisma.topic.findUnique({ where: { id } })

    if (topic?.thumbnailPublicId) {
      try {
        await cloudinary.uploader.destroy(topic.thumbnailPublicId)
      } catch (err) {
        console.error('Failed to delete topic thumbnail:', err)
      }
    }

    await prisma.video.updateMany({
      where: { topicId: id },
      data: { topicId: null },
    })

    await prisma.topic.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete topic error:', error)
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
  }
}