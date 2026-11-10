
import {
  S3Client,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'

import { getSignedVideoUrl } from '@/lib/r2'

const r2 = new S3Client({
  region: 'auto',
  endpoint:
    `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

export function validQuizMediaKey(key, type) {
  if (typeof key !== 'string') {
    return false
  }

  if (type === 'image') {
    return /^quiz-questions\/[a-f0-9-]{36}\.(jpg|png|webp)$/i
      .test(key)
  }

  if (type === 'video') {
    return /^quiz-explanations\/[a-f0-9-]{36}\.(mp4|webm)$/i
      .test(key)
  }

  return false
}

export async function verifyQuizMedia(key, type) {
  if (!validQuizMediaKey(key, type)) {
    throw new Error('Invalid quiz media key')
  }

  const info = await r2.send(
    new HeadObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    })
  )

  const size = Number(info.ContentLength || 0)

  if (size <= 0) {
    throw new Error('Uploaded file is empty')
  }

  if (type === 'image') {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowed.includes(info.ContentType)) {
      throw new Error('Invalid question image')
    }
  }

  if (type === 'video') {
    const allowed = [
      'video/mp4',
      'video/webm',
    ]

    if (!allowed.includes(info.ContentType)) {
      throw new Error('Invalid explanation video')
    }

    // No application-imposed video size limit.
  }

  return info
}

export async function signedQuizMediaUrl(
  key,
  type,
  expiresIn = 600
) {
  if (!validQuizMediaKey(key, type)) {
    throw new Error('Invalid quiz media key')
  }

  return getSignedVideoUrl(key, expiresIn)
}
