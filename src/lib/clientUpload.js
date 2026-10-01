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
 * Upload image directly to Cloudinary from browser
 */
export async function uploadImageToCloudinary(file, folder) {
  console.log(`📤 Uploading image: ${file.name} → ${folder}`)

  const signRes = await fetch('/api/admin/cloudinary-sign', {
    method:      'POST',
    headers:     authHeaders(),
    credentials: 'include',
    body:        JSON.stringify({ folder }),
  })

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}))
    throw new Error(
      `Cloudinary sign failed (${signRes.status}): ${err.error || 'Unknown error'}`
    )
  }

  const { signature, timestamp, cloudName, apiKey, folder: signedFolder } =
    await signRes.json()

  // Upload directly from browser to Cloudinary (bypasses Vercel)
  const formData = new FormData()
  formData.append('file',      file)
  formData.append('signature', signature)
  formData.append('timestamp', String(timestamp))
  formData.append('api_key',   apiKey)
  formData.append('folder',    signedFolder)

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}))
    throw new Error(
      `Cloudinary upload failed: ${err.error?.message || uploadRes.status}`
    )
  }

  const data = await uploadRes.json()
  console.log('✅ Cloudinary done:', data.public_id)

  return {
    url:      data.secure_url,
    publicId: data.public_id,
  }
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