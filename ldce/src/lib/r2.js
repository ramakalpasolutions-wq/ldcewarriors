// src/lib/r2.js
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL

/**
 * Upload video buffer to Cloudflare R2
 */
export async function uploadVideoToR2(buffer, originalName, mimeType, folder = 'videos') {
  const ext = originalName.split('.').pop()
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  await R2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000',
    Metadata: {
      originalName,
      uploadedAt: new Date().toISOString(),
    },
  }))

  const url = `${PUBLIC_URL}/${key}`
  return { key, url }
}

/**
 * Delete video from Cloudflare R2
 */
export async function deleteVideoFromR2(key) {
  if (!key) return
  try {
    await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch (err) {
    console.error('R2 delete error:', err)
  }
}

/**
 * Generate a signed URL for private R2 objects (expires in 1 hour)
 */
export async function getSignedVideoUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return await getSignedUrl(R2, command, { expiresIn })
}

/**
 * Upload via multipart for large files (> 100MB)
 */
export async function uploadLargeVideoToR2(stream, originalName, mimeType, folder = 'videos') {
  const {
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
  } = await import('@aws-sdk/client-s3')

  const ext = originalName.split('.').pop()
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { UploadId } = await R2.send(new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  }))

  const parts = []
  const chunks = []
  let chunkSize = 0
  const MIN_PART = 5 * 1024 * 1024 // 5MB min per part

  try {
    for await (const chunk of stream) {
      chunks.push(chunk)
      chunkSize += chunk.length
      if (chunkSize >= MIN_PART) {
        const partNum = parts.length + 1
        const body = Buffer.concat(chunks)
        const { ETag } = await R2.send(new UploadPartCommand({
          Bucket: BUCKET, Key: key, UploadId,
          PartNumber: partNum, Body: body,
        }))
        parts.push({ PartNumber: partNum, ETag })
        chunks.length = 0
        chunkSize = 0
      }
    }

    if (chunks.length > 0) {
      const partNum = parts.length + 1
      const { ETag } = await R2.send(new UploadPartCommand({
        Bucket: BUCKET, Key: key, UploadId,
        PartNumber: partNum, Body: Buffer.concat(chunks),
      }))
      parts.push({ PartNumber: partNum, ETag })
    }

    await R2.send(new CompleteMultipartUploadCommand({
      Bucket: BUCKET, Key: key, UploadId,
      MultipartUpload: { Parts: parts },
    }))

    return { key, url: `${PUBLIC_URL}/${key}` }
  } catch (err) {
    await R2.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId }))
    throw err
  }
}