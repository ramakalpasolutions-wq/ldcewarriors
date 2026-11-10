
const MiB = 1024 * 1024

const SINGLE_VIDEO_THRESHOLD = 64 * MiB

async function api(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || 'R2 upload request failed'
    )
  }

  return data
}

function uploadPartWithXHR(
  url,
  blob,
  contentType,
  onProgress = () => {}
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('PUT', url)
    xhr.timeout = 60 * 60 * 1000

    // Only single uploads sign Content-Type.
    // Multipart part uploads do not need this header.
    if (contentType) {
      xhr.setRequestHeader(
        'Content-Type',
        contentType
      )
    }

    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        onProgress(event.loaded)
      }
    }

    xhr.onload = () => {
      if ([200, 201, 204].includes(xhr.status)) {
        resolve({
          etag: xhr.getResponseHeader('ETag'),
        })
      } else {
        reject(
          new Error(
            `Cloudflare R2 rejected upload: HTTP ${xhr.status}`
          )
        )
      }
    }

    xhr.onerror = () =>
      reject(new Error('Network or R2 CORS error'))

    xhr.ontimeout = () =>
      reject(new Error('R2 upload timed out'))

    xhr.onabort = () =>
      reject(new Error('R2 upload cancelled'))

    xhr.send(blob)
  })
}

async function uploadSingle(file, folder, onProgress) {
  const signed = await api(
    '/api/admin/quizzes/presign',
    {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      folder,
    }
  )

  await uploadPartWithXHR(
    signed.presignedUrl,
    file,
    file.type,
    loaded => {
      onProgress(
        Math.min(
          99,
          Math.round((loaded / file.size) * 100)
        )
      )
    }
  )

  onProgress(100)

  return {
    key: signed.key,
    name: file.name,
  }
}

async function multipartApi(body) {
  return api(
    '/api/admin/quizzes/multipart',
    body
  )
}

async function uploadMultipartVideo(
  file,
  onProgress
) {
  const started = await multipartApi({
    action: 'start',
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  })

  const { key, uploadId } = started

  // Keep the part count below R2's 10,000-part limit.
  // Every part except the final part is at least 32 MiB.
  const partSize = Math.max(
    32 * MiB,
    Math.ceil(file.size / 9900 / MiB) * MiB
  )

  const totalParts = Math.ceil(
    file.size / partSize
  )

  const parts = []
  let completedBytes = 0

  try {
    for (let index = 0; index < totalParts; index++) {
      const partNumber = index + 1
      const start = index * partSize
      const end = Math.min(
        file.size,
        start + partSize
      )

      const chunk = file.slice(start, end)

      const signed = await multipartApi({
        action: 'sign',
        key,
        uploadId,
        partNumber,
      })

      const uploaded = await uploadPartWithXHR(
        signed.presignedUrl,
        chunk,
        null,
        loaded => {
          const progress = Math.round(
            (
              (completedBytes + loaded) /
              file.size
            ) * 100
          )

          onProgress(Math.min(99, progress))
        }
      )

      if (!uploaded.etag) {
        throw new Error(
          'R2 did not expose ETag. Add ETag to the bucket CORS ExposeHeaders configuration.'
        )
      }

      parts.push({
        PartNumber: partNumber,
        ETag: uploaded.etag,
      })

      completedBytes += chunk.size
    }

    await multipartApi({
      action: 'complete',
      key,
      uploadId,
      parts,
    })

    onProgress(100)

    return {
      key,
      name: file.name,
    }
  } catch (error) {
    // Clean up incomplete multipart uploads when possible.
    await multipartApi({
      action: 'abort',
      key,
      uploadId,
    }).catch(() => {})

    throw error
  }
}

export async function uploadQuizMedia(
  file,
  folder,
  onProgress = () => {}
) {
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error('Select a valid file')
  }

  if (folder === 'quiz-questions') {
    if (
      !['image/jpeg', 'image/png', 'image/webp']
        .includes(file.type)
    ) {
      throw new Error('Use JPG, PNG or WebP images')
    }

    return uploadSingle(
      file,
      folder,
      onProgress
    )
  }

  if (folder === 'quiz-explanations') {
    if (
      !['video/mp4', 'video/webm']
        .includes(file.type)
    ) {
      throw new Error(
        'Use MP4 or WebM explanation videos'
      )
    }

    // No arbitrary video-size limit.
    // R2's own service limits still apply.
    if (file.size > SINGLE_VIDEO_THRESHOLD) {
      return uploadMultipartVideo(
        file,
        onProgress
      )
    }

    return uploadSingle(
      file,
      folder,
      onProgress
    )
  }

  throw new Error('Unsupported quiz media folder')
}
