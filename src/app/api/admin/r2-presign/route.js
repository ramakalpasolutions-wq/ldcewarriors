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

<<<<<<< HEAD
    const { fileName, fileType, folder = 'videos', fileSize } = await req.json()
=======
    const { fileName, fileType, folder = 'videos' } = await req.json()
>>>>>>> master

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

<<<<<<< HEAD
    // ✅ Increase expiry for large files:
    //    < 500MB  → 2 hours
    //    >= 500MB → 4 hours
    //    >= 2GB   → 6 hours
    let expiresIn = 7200 // 2 hours default
    if (fileSize) {
      if (fileSize >= 2 * 1024 * 1024 * 1024) {
        expiresIn = 21600 // 6 hours for 2GB+
      } else if (fileSize >= 500 * 1024 * 1024) {
        expiresIn = 14400 // 4 hours for 500MB+
      }
    }

    const presignedUrl = await getSignedUrl(R2, command, { expiresIn })
=======
    // Presigned URL valid for 2 hours (big videos need time)
    const presignedUrl = await getSignedUrl(R2, command, { expiresIn: 7200 })
>>>>>>> master
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