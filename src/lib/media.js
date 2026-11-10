// src/lib/media.js
// Images and documents (thumbnails, topic pictures, banner images,
// article files) stored in Cloudflare R2 under the "media/" folder.
// They are shown through /api/media/<key>, which hands out a
// short-lived link — so the bucket itself never needs public access.

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
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

export const MEDIA_PREFIX = 'media/'

const EXT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

// Only files in media/ — never class videos or quiz media — and no tricks like "../"
export function isMediaKey(key) {
  return (
    typeof key === 'string' &&
    key.startsWith(MEDIA_PREFIX) &&
    !key.includes('..') &&
    /^[\w./-]+$/.test(key)
  )
}

export function mediaUrl(key) {
  return `/api/media/${key}`
}

function cleanFolder(folder) {
  return String(folder || 'misc')
    .replace(/^ldce\//, '')
    .replace(/[^\w/-]/g, '')
    .replace(/^\/+|\/+$/g, '') || 'misc'
}

export function newMediaKey(folder, ext) {
  const safeExt = String(ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const rand = Math.random().toString(36).slice(2, 10)
  return `${MEDIA_PREFIX}${cleanFolder(folder)}/${Date.now()}-${rand}.${safeExt}`
}

export function contentTypeFor(ext, fallback = 'application/octet-stream') {
  return EXT_TYPES[String(ext || '').toLowerCase()] || fallback
}

export async function uploadMediaBuffer(buffer, { folder, ext, contentType }) {
  const key = newMediaKey(folder, ext)
  await R2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || contentTypeFor(ext),
    CacheControl: 'public, max-age=31536000, immutable',
  }))
  return { url: mediaUrl(key), publicId: key, key }
}

/* Upload an image given as a data URI ("data:image/png;base64,…") */
export async function uploadImage(dataUri, folder = 'images') {
  const match = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(dataUri))
  if (!match) throw new Error('Invalid image data')
  const contentType = match[1]
  const ext = Object.keys(EXT_TYPES).find(e => EXT_TYPES[e] === contentType) || 'jpg'
  return uploadMediaBuffer(Buffer.from(match[2], 'base64'), {
    folder: `images/${cleanFolder(folder)}`,
    ext,
    contentType,
  })
}

/* Upload a document (DOCX, PDF…) from a Buffer */
export async function uploadRawFile(buffer, originalName, folder = 'docs') {
  const ext = String(originalName || '').split('.').pop()
  const result = await uploadMediaBuffer(buffer, {
    folder: `docs/${cleanFolder(folder)}`,
    ext,
    contentType: contentTypeFor(ext),
  })
  return { ...result, bytes: buffer.length }
}

export async function deleteMedia(key) {
  if (!isMediaKey(key)) return { success: false }
  try {
    await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    return { success: true }
  } catch (error) {
    console.error('R2 media delete error:', error.message)
    return { success: false, error: error.message }
  }
}

// Older names kept so existing callers keep working
export const deleteImage = deleteMedia
export const deleteRawFile = deleteMedia

export async function signedMediaUrl(key, expiresIn = 24 * 60 * 60) {
  if (!isMediaKey(key)) throw new Error('Invalid media key')
  return getSignedUrl(R2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn })
}

export async function getMediaBuffer(key) {
  if (!isMediaKey(key)) throw new Error('Invalid media key')
  const res = await R2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  return Buffer.from(await res.Body.transformToByteArray())
}

// "/api/media/media/…"  →  "media/…"
export function keyFromMediaUrl(url) {
  const m = /^\/api\/media\/(media\/.+)$/.exec(String(url || ''))
  return m && isMediaKey(m[1]) ? m[1] : null
}
