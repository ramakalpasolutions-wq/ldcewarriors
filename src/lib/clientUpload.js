// src/lib/clientUpload.js

/**
 * Get the admin token from wherever it's stored
 */
function getAdminToken() {
  // Try localStorage first (common pattern)
  if (typeof window !== 'undefined') {
    const fromStorage =
      localStorage.getItem('adminToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('adminToken') ||
      sessionStorage.getItem('token')
    if (fromStorage) return fromStorage
  }
  // Cookie will be sent automatically via credentials:'include'
  return null
}

/**
 * Build headers with auth token
 */
function authHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = getAdminToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * Upload an image straight from the browser to Cloudflare R2.
 * Returns { url, publicId } — url is the site's /api/media/… address,
 * publicId is the R2 key (used later to delete or replace it).
 */
export async function uploadImageToR2(file, folder = 'images') {
  const safeFolder =
    'media/images/' +
    (String(folder).replace(/^ldce\//, '').replace(/[^\w/-]/g, '').replace(/^\/+|\/+$/g, '') || 'misc')

  // Very large images go up in parts too
  if (file.size > PART_UPLOAD_ABOVE) {
    const { key } = await uploadInParts(file, safeFolder)
    return { url: `/api/media/${key}`, publicId: key }
  }

  const presignRes = await fetch('/api/admin/r2-presign', {
    method:      'POST',
    headers:     authHeaders(),
    credentials: 'include',
    body:        JSON.stringify({
      fileName: file.name || 'image.jpg',
      fileType: file.type || 'image/jpeg',
      folder:   safeFolder,
    }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error(`Image upload failed (${presignRes.status}): ${err.error || 'Unknown error'}`)
  }

  const { presignedUrl, key } = await presignRes.json()

  const putRes = await fetch(presignedUrl, {
    method:  'PUT',
    headers: { 'Content-Type': file.type || 'image/jpeg' },
    body:    file,
  })

  if (!putRes.ok) {
    throw new Error(`Image upload failed (HTTP ${putRes.status})`)
  }

  return { url: `/api/media/${key}`, publicId: key }
}

/* ─────────────────────────────────────────
   Large files: upload in parts (no size limit, no single long request)
───────────────────────────────────────── */
const MiB = 1024 * 1024
const PART_UPLOAD_ABOVE = 64 * MiB

async function multipartCall(body) {
  const res = await fetch('/api/admin/r2-multipart', {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
  return data
}

function putPart(url, blob, onLoaded) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = e => e.lengthComputable && onLoaded(e.loaded)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag')
        etag ? resolve(etag) : reject(new Error('R2 did not return ETag — add ETag to the bucket CORS "ExposeHeaders"'))
      } else {
        reject(new Error(`R2 rejected a part (HTTP ${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error — check R2 CORS settings'))
    xhr.onabort = () => reject(new Error('Upload cancelled'))
    xhr.send(blob)
  })
}

async function uploadInParts(file, folder, onProgress) {
  const { key, uploadId } = await multipartCall({
    action: 'start',
    folder,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
  })

  // R2 allows at most 10,000 parts, each at least 5 MB
  const partSize = Math.max(32 * MiB, Math.ceil(file.size / 9900 / MiB) * MiB)
  const total = Math.ceil(file.size / partSize)
  const parts = []
  let done = 0

  try {
    for (let i = 0; i < total; i++) {
      const blob = file.slice(i * partSize, Math.min(file.size, (i + 1) * partSize))
      let etag
      // Retry a part a few times so a brief network drop doesn't lose the whole upload
      for (let attempt = 1; ; attempt++) {
        try {
          const { presignedUrl } = await multipartCall({ action: 'sign', key, uploadId, partNumber: i + 1 })
          etag = await putPart(presignedUrl, blob, loaded =>
            onProgress?.(Math.min(99, Math.round(((done + loaded) / file.size) * 100))))
          break
        } catch (err) {
          if (attempt >= 3 || /cancelled/i.test(err.message)) throw err
          await new Promise(r => setTimeout(r, 1500 * attempt))
        }
      }
      parts.push({ PartNumber: i + 1, ETag: etag })
      done += blob.size
    }

    const { publicUrl } = await multipartCall({ action: 'complete', key, uploadId, parts })
    onProgress?.(100)
    return { key, publicUrl }
  } catch (error) {
    await multipartCall({ action: 'abort', key, uploadId }).catch(() => {})
    throw error
  }
}

/**
 * Upload video directly to Cloudflare R2 from browser
 * onProgress(0–100) called during upload
 */
export async function uploadVideoToR2Direct(file, folder, onProgress) {
  // Big files go up in parts — no size limit and no single long request
  if (file.size > PART_UPLOAD_ABOVE) {
    return uploadInParts(file, folder, onProgress)
  }

  console.log(
    `📤 Uploading video: ${file.name}`,
    `(${(file.size / 1024 / 1024).toFixed(1)} MB) → ${folder}`
  )

  // Step 1: Get presigned URL (tiny request, well under 4.5MB limit)
  const presignRes = await fetch('/api/admin/r2-presign', {
    method:      'POST',
    headers:     authHeaders(),
    credentials: 'include',
    body:        JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'video/mp4',
      folder,
    }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error(
      `R2 presign failed (${presignRes.status}): ${err.error || 'Unknown error'}`
    )
  }

  const { presignedUrl, key, publicUrl } = await presignRes.json()
  console.log('✅ Got presigned URL, uploading directly to R2...')

  // Step 2: Upload directly to R2 (bypasses Vercel completely)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 204) {
        console.log('✅ R2 upload complete')
        resolve()
      } else {
        console.error('R2 upload failed:', xhr.status, xhr.responseText)
        reject(
          new Error(
            `R2 upload failed (HTTP ${xhr.status}). ` +
            `Check your R2 CORS settings.`
          )
        )
      }
    })

    xhr.addEventListener('error', () =>
      reject(new Error('Network error — check R2 CORS settings'))
    )
    xhr.addEventListener('abort', () =>
      reject(new Error('Upload cancelled'))
    )

    // PUT directly to R2's presigned URL
    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
    xhr.timeout = 60 * 60 * 1000 // 1 hour timeout
    xhr.send(file)
  })

  return { key, publicUrl }
}

/**
 * Upload any document (e.g. an article's Word file) straight to R2.
 * Returns { url, key } — url is the site's /api/media/… address.
 */
export async function uploadDocToR2(file, folder = 'docs') {
  const safeFolder =
    'media/docs/' +
    (String(folder).replace(/^ldce\//, '').replace(/[^\w/-]/g, '').replace(/^\/+|\/+$/g, '') || 'misc')

  if (file.size > PART_UPLOAD_ABOVE) {
    const { key } = await uploadInParts(file, safeFolder)
    return { url: `/api/media/${key}`, key }
  }

  const type = file.type || 'application/octet-stream'
  const presignRes = await fetch('/api/admin/r2-presign', {
    method:      'POST',
    headers:     authHeaders(),
    credentials: 'include',
    body:        JSON.stringify({ fileName: file.name || 'file.bin', fileType: type, folder: safeFolder }),
  })
  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error(`Upload failed (${presignRes.status}): ${err.error || 'Unknown error'}`)
  }
  const { presignedUrl, key } = await presignRes.json()
  const putRes = await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': type }, body: file })
  if (!putRes.ok) throw new Error(`Upload failed (HTTP ${putRes.status})`)
  return { url: `/api/media/${key}`, key }
}
