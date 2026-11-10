// scripts/migrate-cloudinary-to-r2.mjs
//
// Copies every image/document still hosted on Cloudinary into Cloudflare R2
// (under media/…) and points the database at the new copy.
// Cloudinary files are NOT deleted — they stay as a backup.
//
//   node scripts/migrate-cloudinary-to-r2.mjs           → dry run (changes nothing)
//   node scripts/migrate-cloudinary-to-r2.mjs --apply   → copy files + update database
//   node scripts/migrate-cloudinary-to-r2.mjs --restore → point the database back at the
//                                                         Cloudinary links (uses the backup)
//
// Before writing, the old links are saved to scripts/.cloudinary-migration-backup.json

import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

dotenv.config({ path: '.env.local', quiet: true })
dotenv.config({ quiet: true })

const APPLY = process.argv.includes('--apply')
const RESTORE = process.argv.includes('--restore')
const prisma = new PrismaClient()
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const TYPE_EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'image/avif': 'avif', 'image/svg+xml': 'svg', 'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
}

const isCloudinary = url => typeof url === 'string' && url.includes('res.cloudinary.com')

// Which records/fields to move
const JOBS = [
  { model: 'video',   label: 'Video thumbnail',   urlField: 'thumbnail', idField: 'thumbnailPublicId', folder: 'images/thumbnails' },
  { model: 'topic',   label: 'Topic picture',     urlField: 'thumbnail', idField: 'thumbnailPublicId', folder: 'images/topics' },
  { model: 'hero',    label: 'Banner image',      urlField: 'mediaUrl',  idField: 'mediaPublicId',     folder: 'images/hero' },
  { model: 'article', label: 'Article thumbnail', urlField: 'thumbnail', idField: 'thumbnailPublicId', folder: 'images/articles' },
  { model: 'article', label: 'Article document',  urlField: 'docxUrl',   idField: 'docxPublicId',      folder: 'docs/articles' },
]

function extFor(url, contentType) {
  const fromType = TYPE_EXT[(contentType || '').split(';')[0].trim().toLowerCase()]
  if (fromType) return fromType
  const m = /\.([a-z0-9]{2,5})(?:$|\?)/i.exec(new URL(url).pathname)
  return m ? m[1].toLowerCase() : 'bin'
}

async function restore() {
  const backupPath = path.join('scripts', '.cloudinary-migration-backup.json')
  const rows = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  for (const r of rows) {
    await prisma[r.model].update({
      where: { id: r.id },
      data: { [r.field]: r.url, [r.idField]: r.publicId },
    })
  }
  console.log(`Restored ${rows.length} records to their Cloudinary links.`)
}

async function main() {
  if (RESTORE) return restore()
  const todo = []
  for (const job of JOBS) {
    const rows = await prisma[job.model].findMany({
      select: { id: true, [job.urlField]: true, [job.idField]: true },
    })
    for (const row of rows) {
      if (isCloudinary(row[job.urlField])) todo.push({ job, row })
    }
  }

  console.log(`${APPLY ? 'MOVING' : 'DRY RUN —'} ${todo.length} files from Cloudinary to R2\n`)
  if (!todo.length) return

  const backupPath = path.join('scripts', '.cloudinary-migration-backup.json')
  if (APPLY) {
    fs.writeFileSync(backupPath, JSON.stringify(todo.map(({ job, row }) => ({
      model: job.model, id: row.id, field: job.urlField, url: row[job.urlField],
      idField: job.idField, publicId: row[job.idField] ?? null,
    })), null, 2))
    console.log(`Backup of old links saved to ${backupPath}\n`)
  }

  let moved = 0
  let failed = 0
  for (const { job, row } of todo) {
    const oldUrl = row[job.urlField]
    try {
      const res = await fetch(oldUrl)
      if (!res.ok) throw new Error(`download failed (HTTP ${res.status})`)
      const contentType = res.headers.get('content-type') || 'application/octet-stream'
      const body = Buffer.from(await res.arrayBuffer())
      const ext = extFor(oldUrl, contentType)
      const key = `media/${job.folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

      if (APPLY) {
        await R2.send(new PutObjectCommand({
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }))
        await prisma[job.model].update({
          where: { id: row.id },
          data: { [job.urlField]: `/api/media/${key}`, [job.idField]: key },
        })
      }
      moved++
      console.log(`✓ ${job.label.padEnd(18)} ${(body.length / 1024).toFixed(0).padStart(6)} KB  → ${APPLY ? key : '(not written, dry run)'}`)
    } catch (err) {
      failed++
      console.log(`✗ ${job.label.padEnd(18)} ${row.id}: ${err.message} — left on Cloudinary`)
    }
  }

  console.log(`\n${moved} ${APPLY ? 'moved' : 'ready to move'}, ${failed} failed.`)
}

main()
  .catch(err => { console.error(err); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
