// src/app/api/materials/[id]/read/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSignedVideoUrl } from '@/lib/r2'
import { requireAdmin } from '@/lib/adminAuth'
import { verifyToken } from '@/lib/auth'
import { hasPremiumAccess, validObjectId } from '@/lib/quizAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

async function currentUser(req) {
  const token = req.cookies.get('token')?.value
  const decoded = token ? verifyToken(token) : null
  const id = decoded?.userId || decoded?.id
  if (!validObjectId(id)) return null

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, fullName: true, email: true, mobile: true,
      isActive: true, isPremium: true, premiumExpiresAt: true,
    },
  })
  return user?.isActive ? user : null
}

/*
  POST /api/materials/:id/read
  Checks access and returns a very short-lived link that the in-site
  reader downloads once into memory. The link is never shown to the user.
  FREE     → anyone
  PREMIUM  → signed-in users with an active subscription (or admins)
*/
export async function POST(req, { params }) {
  const { id } = await params

  if (!validObjectId(id)) {
    return NextResponse.json({ success: false, error: 'Invalid material' }, { status: 400 })
  }

  try {
    const material = await prisma.material.findUnique({
      where: { id },
      include: { topic: { select: { id: true, name: true } } },
    })

    if (!material || !material.isPublished) {
      return NextResponse.json({ success: false, error: 'Material not found' }, { status: 404 })
    }

    const admin = requireAdmin(req)
    const user = await currentUser(req)

    if (material.accessType === 'PREMIUM' && !admin) {
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Please sign in to read this textbook', loginRequired: true },
          { status: 401, headers: noStore }
        )
      }
      if (!hasPremiumAccess(user)) {
        return NextResponse.json(
          { success: false, error: 'This textbook is for Join Family members', premiumRequired: true },
          { status: 403, headers: noStore }
        )
      }
    }

    const url = await getSignedVideoUrl(material.pdfKey, 60)

    const watermark = user
      ? [user.fullName, user.mobile, user.email].filter(Boolean).join(' • ')
      : admin
        ? 'LDCE Warriors • Admin preview'
        : 'LDCE Warriors'

    await prisma.material.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch(() => {})

    return NextResponse.json(
      {
        success: true,
        url,
        watermark,
        material: {
          id: material.id,
          title: material.title,
          chapterNo: material.chapterNo,
          pageCount: material.pageCount,
          topic: material.topic,
        },
      },
      { headers: noStore }
    )
  } catch (error) {
    console.error('Material read error:', error)
    return NextResponse.json({ success: false, error: 'Unable to open textbook' }, { status: 500 })
  }
}
