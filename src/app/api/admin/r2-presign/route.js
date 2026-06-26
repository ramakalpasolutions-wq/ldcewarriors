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

    const { fileName, fileType, fileSize, folder = 'videos' } = await req.json()

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      )
    }

    // Validate file size (5GB max — R2 single PUT limit)
    const MAX_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE || '5368709120') // 5GB default
    if (fileSize && fileSize > MAX_SIZE) {
      const maxGB = (MAX_SIZE / (1024 ** 3)).toFixed(2)
      const fileGB = (fileSize / (1024 ** 3)).toFixed(2)
      return NextResponse.json(
        {
          error: `File size must be under ${maxGB}GB. Your file is ${fileGB}GB`,
          maxSize: MAX_SIZE,
          fileSize: fileSize,
        },
        { status: 413 }
      )
    }

    // Safe key
    const ext = (fileName.split('.').pop() || 'bin').toLowerCase()
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // ✅ ONLY sign ContentType — keep it minimal
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      // ❌ REMOVED: CacheControl — was causing signature mismatch
    })

    // Presigned URL valid for 4 hours (big videos on slow connections)
    const presignedUrl = await getSignedUrl(R2, command, { expiresIn: 4 * 60 * 60 })
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`

    console.log('🔑 Presign generated:', { key, fileType, sizeMB: fileSize ? (fileSize / 1024 / 1024).toFixed(1) : '?' })

    return NextResponse.json({ presignedUrl, key, publicUrl })
  } catch (error) {
    console.error('R2 presign error:', error)
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', detail: error.message },
      { status: 500 }
    )
  }
}