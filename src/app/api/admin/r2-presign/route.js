// src/app/api/admin/r2-presign/route.js
import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { verifyToken } from '@/lib/auth'

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
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

    const { fileName, fileType, folder = 'videos' } = await req.json()

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      )
    }

    const ext = fileName.split('.').pop()
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      CacheControl: 'public, max-age=31536000',
    })

    // Presigned URL valid for 2 hours (big videos need time)
    const presignedUrl = await getSignedUrl(R2, command, { expiresIn: 7200 })
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ presignedUrl, key, publicUrl })
  } catch (error) {
    console.error('R2 presign error:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}