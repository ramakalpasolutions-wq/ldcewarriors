
import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireAdmin } from '@/lib/adminAuth'

export const runtime = 'nodejs'

const TYPES = {
  'image/jpeg': {
    folder: 'quiz-questions',
    ext: 'jpg',
  },
  'image/png': {
    folder: 'quiz-questions',
    ext: 'png',
  },
  'image/webp': {
    folder: 'quiz-questions',
    ext: 'webp',
  },
  'video/mp4': {
    folder: 'quiz-explanations',
    ext: 'mp4',
  },
  'video/webm': {
    folder: 'quiz-explanations',
    ext: 'webm',
  },
}

export async function POST(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const {
      fileName,
      fileType,
      fileSize,
      folder,
    } = await req.json()

    const config = TYPES[fileType]
    const size = Number(fileSize)

    if (!config || folder !== config.folder) {
      return NextResponse.json(
        { error: 'Unsupported media type or folder' },
        { status: 400 }
      )
    }

    if (
      !Number.isSafeInteger(size) ||
      size <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid file size' },
        { status: 400 }
      )
    }

    const originalExt = String(fileName || '')
      .split('.')
      .pop()
      .toLowerCase()

    if (
      originalExt !== config.ext &&
      !(
        fileType === 'image/jpeg' &&
        originalExt === 'jpeg'
      )
    ) {
      return NextResponse.json(
        { error: 'File extension does not match type' },
        { status: 400 }
      )
    }

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

    const key =
      `${config.folder}/${randomUUID()}.${config.ext}`

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    })

    const presignedUrl = await getSignedUrl(
      r2,
      command,
      { expiresIn: 3600 }
    )

    return NextResponse.json(
      {
        success: true,
        key,
        presignedUrl,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('R2 presign error:', error)

    return NextResponse.json(
      { error: 'Could not prepare R2 upload' },
      { status: 500 }
    )
  }
}
