// src/app/api/admin/materials/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'
import { deleteVideoFromR2 } from '@/lib/r2'
import { validObjectId } from '@/lib/quizAuth'

export const dynamic = 'force-dynamic'

const unauthorized = () =>
  NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

const bad = (error, status = 400) =>
  NextResponse.json({ success: false, error }, { status })

// Only accept keys that our presign route created in the materials folder
const validPdfKey = key =>
  typeof key === 'string' && /^materials\/[\w.-]+\.pdf$/i.test(key)

function toInt(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// Build the editable fields from a request body
function pickFields(body) {
  const data = {}
  if (body.title !== undefined) data.title = String(body.title).trim()
  if (body.description !== undefined) data.description = String(body.description || '').trim() || null
  if (body.chapterNo !== undefined) data.chapterNo = toInt(body.chapterNo)
  if (body.pageCount !== undefined) data.pageCount = toInt(body.pageCount)
  if (body.order !== undefined) data.order = toInt(body.order) ?? 0
  if (body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished)
  if (body.accessType !== undefined) {
    data.accessType = body.accessType === 'PREMIUM' ? 'PREMIUM' : 'FREE'
  }
  if (body.topicId !== undefined) {
    data.topicId = validObjectId(body.topicId) ? body.topicId : null
  }
  return data
}

/* GET /api/admin/materials — all materials */
export async function GET(req) {
  if (!requireAdmin(req)) return unauthorized()

  try {
    const materials = await prisma.material.findMany({
      orderBy: [{ order: 'asc' }, { chapterNo: 'asc' }, { createdAt: 'desc' }],
      include: { topic: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ success: true, materials })
  } catch (error) {
    console.error('❌ Admin materials GET:', error)
    return bad('Failed to fetch materials', 500)
  }
}

/* POST /api/admin/materials — create (PDF already uploaded to R2) */
export async function POST(req) {
  if (!requireAdmin(req)) return unauthorized()

  try {
    const body = await req.json()
    const data = pickFields(body)

    if (!data.title) return bad('Title is required')
    if (!validPdfKey(body.pdfKey)) return bad('Please upload a PDF file')

    const material = await prisma.material.create({
      data: {
        ...data,
        pdfKey: body.pdfKey,
        fileName: body.fileName ? String(body.fileName).slice(0, 200) : null,
        fileSize: toInt(body.fileSize),
      },
      include: { topic: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ success: true, material }, { status: 201 })
  } catch (error) {
    console.error('❌ Admin materials POST:', error)
    return bad('Failed to create material', 500)
  }
}

/* PUT /api/admin/materials — update fields, optionally replace the PDF */
export async function PUT(req) {
  if (!requireAdmin(req)) return unauthorized()

  try {
    const body = await req.json()
    if (!validObjectId(body.id)) return bad('Material ID required')

    const existing = await prisma.material.findUnique({ where: { id: body.id } })
    if (!existing) return bad('Material not found', 404)

    const data = pickFields(body)
    if (data.title === '') return bad('Title is required')

    const replacingPdf = body.pdfKey && body.pdfKey !== existing.pdfKey
    if (replacingPdf) {
      if (!validPdfKey(body.pdfKey)) return bad('Invalid PDF file')
      data.pdfKey = body.pdfKey
      data.fileName = body.fileName ? String(body.fileName).slice(0, 200) : null
      data.fileSize = toInt(body.fileSize)
    }

    const material = await prisma.material.update({
      where: { id: body.id },
      data,
      include: { topic: { select: { id: true, name: true } } },
    })

    if (replacingPdf) await deleteVideoFromR2(existing.pdfKey)

    return NextResponse.json({ success: true, material })
  } catch (error) {
    console.error('❌ Admin materials PUT:', error)
    return bad('Failed to update material', 500)
  }
}

/* DELETE /api/admin/materials?id=xxx */
export async function DELETE(req) {
  if (!requireAdmin(req)) return unauthorized()

  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!validObjectId(id)) return bad('Material ID required')

    const material = await prisma.material.findUnique({ where: { id } })
    if (!material) return bad('Material not found', 404)

    await prisma.material.delete({ where: { id } })
    await deleteVideoFromR2(material.pdfKey)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Admin materials DELETE:', error)
    return bad('Failed to delete material', 500)
  }
}
