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

/**
 * Upload video directly to Cloudflare R2 from browser
 * onProgress(0–100) called during upload
 */
export async function uploadVideoToR2Direct(file, folder, onProgress) {
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