// src/lib/clientUpload.js

/**
 * Upload image directly to Cloudinary from browser
 */
export async function uploadImageToCloudinary(file, folder) {
<<<<<<< HEAD
=======
  // Get signature from your API
>>>>>>> master
  const signRes = await fetch('/api/admin/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ folder }),
  })

  if (!signRes.ok) throw new Error('Failed to get upload signature')
  const { signature, timestamp, cloudName, apiKey, folder: signedFolder } =
    await signRes.json()

<<<<<<< HEAD
=======
  // Upload directly to Cloudinary
>>>>>>> master
  const formData = new FormData()
  formData.append('file', file)
  formData.append('signature', signature)
  formData.append('timestamp', timestamp)
  formData.append('api_key', apiKey)
  formData.append('folder', signedFolder)

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.json()
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  const data = await uploadRes.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
  }
}

/**
<<<<<<< HEAD
 * Upload video directly to Cloudflare R2 from browser.
 * - No Cloudflare proxy limit (bypasses it entirely with pre-signed URL)
 * - Supports files of any size (R2 allows up to 5TB)
 * - onProgress(percent) called during upload
 */
export async function uploadVideoToR2Direct(file, folder, onProgress) {
  // Step 1: Get pre-signed URL from your API
=======
 * Upload video directly to Cloudflare R2 from browser
 * onProgress(percent) called during upload
 */
export async function uploadVideoToR2Direct(file, folder, onProgress) {
  // Get presigned URL from your API
>>>>>>> master
  const presignRes = await fetch('/api/admin/r2-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
<<<<<<< HEAD
      fileSize: file.size, // ✅ Pass file size so API can adjust expiry for large files
=======
>>>>>>> master
      folder,
    }),
  })

  if (!presignRes.ok) throw new Error('Failed to get presigned URL')
  const { presignedUrl, key, publicUrl } = await presignRes.json()

<<<<<<< HEAD
  // Step 2: Upload directly to R2 using XHR (supports progress + large files)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // ✅ 4-hour timeout for very large video files (e.g. 2GB+)
    xhr.timeout = 4 * 60 * 60 * 1000

=======
  // Upload directly to R2 using XHR for progress tracking
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

>>>>>>> master
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      // R2 returns 200 or 204 on success
      if (xhr.status === 200 || xhr.status === 204) {
        resolve()
      } else {
        reject(new Error(`R2 upload failed with status: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during R2 upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))
<<<<<<< HEAD
    xhr.addEventListener('timeout', () => reject(new Error('Upload timed out — file may be too large for your connection')))
=======
>>>>>>> master

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })

  return { key, publicUrl }
}