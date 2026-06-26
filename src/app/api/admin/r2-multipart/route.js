// src/app/api/admin/r2-multipart/route.js
import { NextResponse } from 'next/server'
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
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

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME

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

    const body = await req.json()
    const { action } = body

    // ===== 1. INIT: Start multipart upload =====
    if (action === 'init') {
      const { fileName, fileType, folder = 'videos' } = body
      if (!fileName || !fileType) {
        return NextResponse.json(
          { error: 'fileName and fileType required' },
          { status: 400 }
        )
      }

      const ext = (fileName.split('.').pop() || 'bin').toLowerCase()
      const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const cmd = new CreateMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: fileType,
      })

      const { UploadId } = await R2.send(cmd)
      console.log('🚀 Multipart init:', { key, uploadId: UploadId })

      return NextResponse.json({ uploadId: UploadId, key })
    }

    // ===== 2. SIGN-PART: Get presigned URL for one chunk =====
    if (action === 'sign-part') {
      const { key, uploadId, partNumber } = body

      const cmd = new UploadPartCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      })

      // 4 hour expiry per part
      const url = await getSignedUrl(R2, cmd, { expiresIn: 4 * 60 * 60 })
      return NextResponse.json({ url })
    }

    // ===== 3. COMPLETE: Finalize multipart upload =====
    if (action === 'complete') {
      const { key, uploadId, parts } = body

      const cmd = new CompleteMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })

      await R2.send(cmd)
      const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`

      console.log('✅ Multipart complete:', { key, parts: parts.length })
      return NextResponse.json({ success: true, key, publicUrl })
    }

    // ===== 4. ABORT: Cancel multipart upload (cleanup) =====
    if (action === 'abort') {
      const { key, uploadId } = body

      await R2.send(
        new AbortMultipartUploadCommand({
          Bucket: BUCKET,
          Key: key,
          UploadId: uploadId,
        })
      )

      console.log('🛑 Multipart aborted:', { key })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('R2 multipart error:', err)
    return NextResponse.json(
      { error: err.message || 'Multipart upload failed' },
      { status: 500 }
    )
  }
} 