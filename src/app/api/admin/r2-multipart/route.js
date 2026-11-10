// src/app/api/admin/r2-multipart/route.js
// Uploads large files to Cloudflare R2 in parts, straight from the browser.
// No size limit from the site (R2 allows objects up to ~5 TB) and no single
// long request that can time out. Admin only, and only into the site's own
// upload folders.
import { NextResponse } from 'next/server'
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME

function getR2() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  })
}

// Folders this route may write to
const FOLDER_RE = /^(videos|hero\/videos|materials|media\/[a-z0-9/_-]{1,80})$/i
const KEY_RE = /^(videos|hero\/videos|materials|media\/[a-z0-9/_-]{1,80})\/\d{10,16}-[a-z0-9]{6,16}\.[a-z0-9]{1,8}$/i

const bad = message => NextResponse.json({ error: message }, { status: 400 })

export async function POST(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const r2 = getR2()

    if (body.action === 'start') {
      const folder = String(body.folder || '')
      if (!FOLDER_RE.test(folder) || folder.includes('..')) return bad('Invalid folder')

      const ext = String(body.fileName || '').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
      const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 12)}.${ext}`

      const created = await r2.send(new CreateMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: String(body.fileType || 'application/octet-stream').slice(0, 120),
      }))
      if (!created.UploadId) throw new Error('R2 did not return an upload id')

      return NextResponse.json({ success: true, key, uploadId: created.UploadId })
    }

    const { key, uploadId } = body
    if (typeof key !== 'string' || !KEY_RE.test(key) || key.includes('..')) return bad('Invalid upload')
    if (typeof uploadId !== 'string' || !uploadId || uploadId.length > 1024) return bad('Invalid upload')

    if (body.action === 'sign') {
      const partNumber = Number(body.partNumber)
      if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) return bad('Invalid part number')

      const presignedUrl = await getSignedUrl(
        r2,
        new UploadPartCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber }),
        { expiresIn: 3600 }
      )
      return NextResponse.json({ success: true, presignedUrl })
    }

    if (body.action === 'complete') {
      const parts = body.parts
      const ok = Array.isArray(parts) && parts.length > 0 && parts.length <= 10000 &&
        parts.every((p, i) => p && p.PartNumber === i + 1 && typeof p.ETag === 'string' && p.ETag.length > 0 && p.ETag.length < 256)
      if (!ok) return bad('Invalid uploaded parts')

      await r2.send(new CompleteMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }))
      return NextResponse.json({
        success: true,
        key,
        publicUrl: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`,
      })
    }

    if (body.action === 'abort') {
      await r2.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId }))
      return NextResponse.json({ success: true })
    }

    return bad('Unsupported action')
  } catch (error) {
    console.error('R2 multipart error:', error)
    return NextResponse.json({ error: 'Upload to Cloudflare R2 failed' }, { status: 500 })
  }
}
