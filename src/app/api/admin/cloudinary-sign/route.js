// src/app/api/admin/cloudinary-sign/route.js
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyToken } from '@/lib/auth'

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

export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { folder } = await req.json()

    const timestamp = Math.round(Date.now() / 1000)

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    )

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    })
  } catch (error) {
    console.error('Cloudinary sign error:', error)
    return NextResponse.json(
      { error: 'Failed to sign upload' },
      { status: 500 }
    )
  }
}