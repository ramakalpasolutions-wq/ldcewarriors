// src/app/api/admin/cloudinary-sign/route.js
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyToken } from '@/lib/auth'

function requireAdmin(req) {
  // Try cookie first
  let token = req.cookies.get('adminToken')?.value

  // Fallback: Authorization header
  if (!token) {
    const authHeader = req.headers.get('authorization') || ''
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim()
    }
  }

  if (!token) return null

  try {
    const decoded = verifyToken(token)
    return decoded?.role === 'admin' ? decoded : null
  } catch {
    return null
  }
}

export async function POST(req) {
  try {
    const admin = requireAdmin(req)

    if (!admin) {
      console.log('Cloudinary sign: unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey    = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary env vars')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })

    const { folder } = await req.json()
    const timestamp  = Math.round(Date.now() / 1000)

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      apiSecret
    )

    console.log('✅ Cloudinary signature generated for folder:', folder)

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
    })
  } catch (error) {
    console.error('Cloudinary sign error:', error)
    return NextResponse.json(
      { error: `Failed: ${error.message}` },
      { status: 500 }
    )
  }
}