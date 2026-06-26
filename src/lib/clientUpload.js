// src/lib/clientUpload.js

/* ========================================================================
 * CLOUDINARY (Images)
 * ===================================================================== */

export async function uploadImageToCloudinary(file, folder) {
  const signRes = await fetch('/api/admin/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ folder }),
  })

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to get upload signature')
  }

  const { signature, timestamp, cloudName, apiKey, folder: signedFolder } =
    await signRes.json()

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
    const err = await uploadRes.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  const data = await uploadRes.json()
  return { url: data.secure_url, publicId: data.public_id }
}

/* ========================================================================
 * CONFIG — Tweak these if needed
 * ===================================================================== */

// Smaller chunks = better recovery on flaky networks
const CHUNK_SIZE = 5 * 1024 * 1024          // 5 MB per chunk
const MULTIPART_THRESHOLD = 20 * 1024 * 1024 // Use multipart for files > 20 MB

// Sequential mode — 1 chunk at a time. MORE reliable on restrictive networks.
// Set to 2-3 only if you're on a fast, stable connection.
const CONCURRENT_UPLOADS = 1

// More retries with longer waits for flaky networks
const MAX_RETRIES_PER_PART = 8

// Timeouts — generous for slow connections
const SINGLE_PUT_TIMEOUT = 60 * 60 * 1000   // 1 hour
const PART_TIMEOUT = 10 * 60 * 1000          // 10 min per chunk

/* ========================================================================
 * R2 SINGLE PUT (for files <= 20MB)
 * ===================================================================== */

async function uploadVideoToR2SinglePut(file, folder, onProgress) {
  const presignRes = await fetch('/api/admin/r2-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      folder,
    }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to get presigned URL')
  }

  const { presignedUrl, key, publicUrl } = await presignRes.json()

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let lastPct = -1

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100)
        if (pct !== lastPct) {
          lastPct = pct
          onProgress(pct)
        }
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`R2 single PUT failed: HTTP ${xhr.status}`))
    })

    xhr.addEventListener('error', () =>
      reject(new Error('Network error during single PUT — check connection'))
    )
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))
    xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')))

    xhr.open('PUT', presignedUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.timeout = SINGLE_PUT_TIMEOUT
    xhr.send(file)
  })

  return { key, publicUrl }
}

/* ========================================================================
 * R2 MULTIPART UPLOAD — Flaky-network resilient
 * - Small 5MB chunks
 * - Sequential by default (most reliable)
 * - 8 retries with exponential backoff (2s → 4s → 8s → 16s → 32s → 64s → 128s)
 * - Each retry gets fresh presigned URL (in case expired)
 * - Resumable: tracks per-chunk byte progress accurately
 * ===================================================================== */

function uploadOnePart(url, chunk, partNumber, onByteProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let lastLoaded = 0

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onByteProgress) {
        const delta = e.loaded - lastLoaded
        lastLoaded = e.loaded
        onByteProgress(delta)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag')
        if (!etag) {
          reject(new Error(
            `Part ${partNumber}: no ETag returned. ` +
            `Check R2 CORS has ExposeHeaders: ["ETag"]`
          ))
          return
        }
        resolve({ PartNumber: partNumber, ETag: etag.replace(/"/g, '') })
      } else {
        reject(new Error(
          `Part ${partNumber} failed: HTTP ${xhr.status} ${xhr.statusText || ''}`
        ))
      }
    })

    xhr.addEventListener('error', () =>
      reject(new Error(`Part ${partNumber}: network error (connection dropped)`))
    )
    xhr.addEventListener('abort', () =>
      reject(new Error(`Part ${partNumber}: aborted`))
    )
    xhr.addEventListener('timeout', () =>
      reject(new Error(`Part ${partNumber}: timed out`))
    )

    xhr.open('PUT', url)
    xhr.timeout = PART_TIMEOUT
    xhr.send(chunk)
  })
}

async function uploadPartWithRetry(
  getSignedUrl,
  chunk,
  partNumber,
  onByteProgress
) {
  let lastErr

  for (let attempt = 1; attempt <= MAX_RETRIES_PER_PART; attempt++) {
    try {
      // Wrap progress callback so retries don't double-count bytes.
      // Each retry resets the per-chunk counter; final delta is corrected at end.
      let attemptBytes = 0
      const wrappedProgress = delta => {
        attemptBytes += delta
        // Only report on FIRST attempt to avoid inflated progress on retry
        if (attempt === 1 && onByteProgress) {
          onByteProgress(delta)
        }
      }

      // Fresh signed URL each attempt (prevents expiry issues on long retries)
      const url = await getSignedUrl(partNumber)
      const result = await uploadOnePart(url, chunk, partNumber, wrappedProgress)

      // If we succeeded on a retry, report the chunk bytes that weren't reported
      if (attempt > 1 && onByteProgress) {
        onByteProgress(chunk.size)
        console.log(`✅ Part ${partNumber} succeeded on attempt ${attempt}`)
      }

      return result
    } catch (err) {
      lastErr = err
      console.warn(
        `⚠️  Part ${partNumber} attempt ${attempt}/${MAX_RETRIES_PER_PART} failed: ${err.message}`
      )

      // Don't wait after the last attempt
      if (attempt < MAX_RETRIES_PER_PART) {
        // Exponential backoff capped at 60s: 2s, 4s, 8s, 16s, 32s, 60s, 60s
        const delay = Math.min(60_000, 2000 * Math.pow(2, attempt - 1))
        console.log(`   ⏳ Waiting ${delay / 1000}s before retry…`)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  throw new Error(
    `Part ${partNumber} failed after ${MAX_RETRIES_PER_PART} attempts. ` +
    `Last error: ${lastErr.message}\n\n` +
    `This usually means your network is blocking sustained uploads to Cloudflare R2. ` +
    `Try: (1) mobile hotspot, (2) different WiFi, or (3) deploy to Vercel and upload from there.`
  )
}

async function uploadVideoToR2Multipart(file, folder, onProgress) {
  const totalParts = Math.ceil(file.size / CHUNK_SIZE)

  console.log(
    `📦 Multipart upload starting:\n` +
    `   File: ${file.name}\n` +
    `   Size: ${(file.size / 1024 / 1024).toFixed(1)} MB\n` +
    `   Chunks: ${totalParts} × ${CHUNK_SIZE / 1024 / 1024} MB\n` +
    `   Mode: ${CONCURRENT_UPLOADS > 1 ? `Parallel (${CONCURRENT_UPLOADS})` : 'Sequential'}\n` +
    `   Retries per chunk: ${MAX_RETRIES_PER_PART}`
  )

  // ----- 1. INIT MULTIPART UPLOAD -----
  const initRes = await fetch('/api/admin/r2-multipart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'init',
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      folder,
    }),
  })

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to initialize multipart upload')
  }

  const { uploadId, key } = await initRes.json()
  console.log(`🚀 Init OK — uploadId: ${uploadId.slice(0, 20)}…`)

  // Helper: get a fresh presigned URL for any part number
  const getPartSignedUrl = async partNumber => {
    const res = await fetch('/api/admin/r2-multipart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'sign-part',
        key,
        uploadId,
        partNumber,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Failed to sign part ${partNumber}`)
    }
    const data = await res.json()
    return data.url
  }

  // ----- 2. UPLOAD ALL PARTS -----
  const uploadedParts = []
  let totalBytesUploaded = 0

  const reportProgress = deltaBytes => {
    totalBytesUploaded += deltaBytes
    if (onProgress) {
      const pct = Math.min(99, Math.round((totalBytesUploaded / file.size) * 100))
      onProgress(pct)
    }
  }

  try {
    if (CONCURRENT_UPLOADS <= 1) {
      // ===== SEQUENTIAL MODE — Most reliable =====
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        const result = await uploadPartWithRetry(
          getPartSignedUrl,
          chunk,
          partNumber,
          reportProgress
        )
        uploadedParts.push(result)

        const pct = ((partNumber / totalParts) * 100).toFixed(0)
        console.log(`✓ Part ${partNumber}/${totalParts} done (${pct}%)`)
      }
    } else {
      // ===== PARALLEL MODE — Faster but more network strain =====
      const queue = []
      for (let i = 0; i < totalParts; i++) queue.push(i + 1)

      async function worker() {
        while (queue.length > 0) {
          const partNumber = queue.shift()
          if (!partNumber) break

          const start = (partNumber - 1) * CHUNK_SIZE
          const end = Math.min(start + CHUNK_SIZE, file.size)
          const chunk = file.slice(start, end)

          const result = await uploadPartWithRetry(
            getPartSignedUrl,
            chunk,
            partNumber,
            reportProgress
          )
          uploadedParts.push(result)
          console.log(`✓ Part ${partNumber}/${totalParts} done`)
        }
      }

      const workers = []
      for (let i = 0; i < CONCURRENT_UPLOADS; i++) workers.push(worker())
      await Promise.all(workers)
    }

    // Multipart requires sorted parts list
    uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber)

    // ----- 3. COMPLETE -----
    if (onProgress) onProgress(99)
    console.log(`📡 Completing multipart upload (${uploadedParts.length} parts)…`)

    const completeRes = await fetch('/api/admin/r2-multipart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'complete',
        key,
        uploadId,
        parts: uploadedParts,
      }),
    })

    if (!completeRes.ok) {
      const err = await completeRes.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to complete multipart upload')
    }

    const data = await completeRes.json()
    if (onProgress) onProgress(100)
    console.log(`✅ Upload complete: ${data.publicUrl}`)
    return { key: data.key, publicUrl: data.publicUrl }

  } catch (err) {
    // Cleanup orphaned upload
    console.error('❌ Multipart upload failed, aborting:', err.message)
    fetch('/api/admin/r2-multipart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'abort', key, uploadId }),
    }).catch(() => {})
    throw err
  }
}

/* ========================================================================
 * PUBLIC API — Smart upload (auto-picks single PUT or multipart)
 * ===================================================================== */

/**
 * Upload a video to Cloudflare R2.
 * Automatically uses multipart for files > 20MB for better reliability.
 *
 * @param {File} file - Video file to upload
 * @param {string} folder - R2 folder path (e.g. 'videos', 'hero/videos')
 * @param {(percent: number) => void} onProgress - Progress callback (0-100)
 * @returns {Promise<{ key: string, publicUrl: string }>}
 */
export async function uploadVideoToR2Direct(file, folder, onProgress) {
  console.log('📦 R2 Upload starting:', {
    name: file.name,
    sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    sizeGB: (file.size / (1024 * 1024 * 1024)).toFixed(3),
    type: file.type || 'unknown',
  })

  // Sanity check — R2 max single PUT is 5GB, max multipart is 5TB
  const MAX_FILE = 5 * 1024 * 1024 * 1024 * 1024 // 5 TB
  if (file.size > MAX_FILE) {
    throw new Error('File exceeds R2 max size (5TB)')
  }

  if (file.size > MULTIPART_THRESHOLD) {
    console.log(`🔀 Using MULTIPART upload (file > ${MULTIPART_THRESHOLD / 1024 / 1024}MB)`)
    return uploadVideoToR2Multipart(file, folder, onProgress)
  } else {
    console.log(`🔀 Using SINGLE PUT (file ≤ ${MULTIPART_THRESHOLD / 1024 / 1024}MB)`)
    return uploadVideoToR2SinglePut(file, folder, onProgress)
  }
}