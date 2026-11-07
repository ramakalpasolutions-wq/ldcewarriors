
import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

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

function getR2() {
  return new S3Client({
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
}

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME

function invalid(message) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  )
}

function validKey(key) {
  return (
    typeof key === 'string' &&
    /^quiz-explanations\/[a-f\d-]{36}\.(mp4|webm)$/i
      .test(key)
  )
}

function validUploadId(uploadId) {
  return (
    typeof uploadId === 'string' &&
    uploadId.length > 0 &&
    uploadId.length <= 1024
  )
}

export async function POST(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const action = body.action
    const r2 = getR2()

    if (action === 'start') {
      const type = body.fileType
      const size = Number(body.fileSize)

      if (!['video/mp4', 'video/webm'].includes(type)) {
        return invalid('Only MP4 and WebM videos are supported')
      }

      if (
        !Number.isSafeInteger(size) ||
        size <= 0
      ) {
        return invalid('Invalid video file')
      }

      const ext = type === 'video/mp4'
        ? 'mp4'
        : 'webm'

      const fileExt = String(body.fileName || '')
        .split('.')
        .pop()
        .toLowerCase()

      if (fileExt !== ext) {
        return invalid('Video extension does not match type')
      }

      const key =
        `quiz-explanations/${randomUUID()}.${ext}`

      const created = await r2.send(
        new CreateMultipartUploadCommand({
          Bucket: BUCKET,
          Key: key,
          ContentType: type,
        })
      )

      if (!created.UploadId) {
        throw new Error('R2 did not return upload ID')
      }

      return NextResponse.json({
        success: true,
        key,
        uploadId: created.UploadId,
      })
    }

    const { key, uploadId } = body

    if (!validKey(key) || !validUploadId(uploadId)) {
      return invalid('Invalid multipart upload')
    }

    if (action === 'sign') {
      const partNumber = Number(body.partNumber)

      if (
        !Number.isInteger(partNumber) ||
        partNumber < 1 ||
        partNumber > 10000
      ) {
        return invalid('Invalid part number')
      }

      const command = new UploadPartCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      })

      const presignedUrl = await getSignedUrl(
        r2,
        command,
        { expiresIn: 3600 }
      )

      return NextResponse.json({
        success: true,
        presignedUrl,
      })
    }

    if (action === 'complete') {
      const parts = body.parts

      if (
        !Array.isArray(parts) ||
        parts.length === 0 ||
        parts.length > 10000
      ) {
        return invalid('Invalid uploaded parts')
      }

      const validParts = parts.every((part, index) =>
        part &&
        part.PartNumber === index + 1 &&
        typeof part.ETag === 'string' &&
        part.ETag.length > 0 &&
        part.ETag.length < 256
      )

      if (!validParts) {
        return invalid('Invalid part ETags or order')
      }

      await r2.send(
        new CompleteMultipartUploadCommand({
          Bucket: BUCKET,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts,
          },
        })
      )

      return NextResponse.json({
        success: true,
        key,
      })
    }

    if (action === 'abort') {
      await r2.send(
        new AbortMultipartUploadCommand({
          Bucket: BUCKET,
          Key: key,
          UploadId: uploadId,
        })
      )

      return NextResponse.json({
        success: true,
      })
    }

    return invalid('Unsupported multipart action')
  } catch (error) {
    console.error('R2 multipart error:', error)

    return NextResponse.json(
      { error: 'Cloudflare R2 multipart request failed' },
      { status: 500 }
    )
  }
}
