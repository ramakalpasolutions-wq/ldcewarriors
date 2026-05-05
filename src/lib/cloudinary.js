// src/lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary'

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

/* ─────────────────────────────────────────────────
   uploadImage  — image resource type
   Supports optional resourceType override so hero
   videos can also be uploaded via this helper.
───────────────────────────────────────────────── */
export async function uploadImage(
  file,
  folder        = 'ldce/thumbnails',
  resourceType  = 'image',
) {
  if (!isConfigured) {
    throw new Error('Cloudinary not configured. Check environment variables.')
  }

  try {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      timeout: resourceType === 'video' ? 120000 : 30000,
    }

    // Only apply image transformation for image uploads
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { width: 1280, height: 720, crop: 'fill', quality: 'auto', format: 'auto' },
      ]
    }

    const result = await cloudinary.uploader.upload(file, uploadOptions)

    console.log(`✅ ${resourceType} uploaded to Cloudinary: ${result.public_id}`)

    return {
      url:      result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error(`❌ Cloudinary ${resourceType} upload error:`, error.message)
    throw new Error(`${resourceType} upload failed: ${error.message}`)
  }
}

/* ─────────────────────────────────────────────────
   uploadRawFile  — raw resource type (DOCX, PDF…)
───────────────────────────────────────────────── */
export async function uploadRawFile(buffer, originalName, folder = 'ldce/documents') {
  if (!isConfigured) {
    throw new Error('Cloudinary not configured. Check environment variables.')
  }

  try {
    const safeName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 80)

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'raw',
          public_id:     `${Date.now()}_${safeName}`,
          timeout:       60000,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      ).end(buffer)
    })

    console.log(`✅ Raw file uploaded to Cloudinary: ${result.public_id} (${result.bytes} bytes)`)

    return {
      url:      result.secure_url,
      publicId: result.public_id,
      bytes:    result.bytes,
    }
  } catch (error) {
    console.error('❌ Cloudinary raw upload error:', error.message)
    throw new Error(`File upload failed: ${error.message}`)
  }
}

/* ─────────────────────────────────────────────────
   deleteImage  — deletes an IMAGE from Cloudinary
───────────────────────────────────────────────── */
export async function deleteImage(publicId) {
  if (!isConfigured || !publicId) return { success: false }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    })
    const ok = result.result === 'ok'
    if (ok) console.log(`✅ Image deleted from Cloudinary: ${publicId}`)
    else    console.warn(`⚠️ Cloudinary image delete result: ${result.result} for ${publicId}`)
    return { success: ok }
  } catch (error) {
    console.error(`❌ Cloudinary image delete error (${publicId}):`, error.message)
    return { success: false, error: error.message }
  }
}

/* ─────────────────────────────────────────────────
   deleteVideo  — deletes a VIDEO from Cloudinary
───────────────────────────────────────────────── */
export async function deleteVideo(publicId) {
  if (!isConfigured || !publicId) return { success: false }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    })
    const ok = result.result === 'ok'
    if (ok) console.log(`✅ Video deleted from Cloudinary: ${publicId}`)
    else    console.warn(`⚠️ Cloudinary video delete result: ${result.result} for ${publicId}`)
    return { success: ok }
  } catch (error) {
    console.error(`❌ Cloudinary video delete error (${publicId}):`, error.message)
    return { success: false, error: error.message }
  }
}

/* ─────────────────────────────────────────────────
   deleteRawFile  — deletes a RAW file from Cloudinary
───────────────────────────────────────────────── */
export async function deleteRawFile(publicId) {
  if (!isConfigured || !publicId) return { success: false }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    })
    const ok = result.result === 'ok'
    if (ok) console.log(`✅ Raw file deleted from Cloudinary: ${publicId}`)
    else    console.warn(`⚠️ Cloudinary raw delete result: ${result.result} for ${publicId}`)
    return { success: ok }
  } catch (error) {
    console.error(`❌ Cloudinary raw delete error (${publicId}):`, error.message)
    return { success: false, error: error.message }
  }
}

/* ─────────────────────────────────────────────────
   deleteMedia  — auto-detects resource type from publicId
   Uses the stored type field to pick the right destroyer.
   Pass resourceType: 'image' | 'video' | 'raw'
───────────────────────────────────────────────── */
export async function deleteMedia(publicId, resourceType = 'image') {
  if (!isConfigured || !publicId) return { success: false }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })
    const ok = result.result === 'ok'
    if (ok) console.log(`✅ ${resourceType} deleted from Cloudinary: ${publicId}`)
    else    console.warn(`⚠️ Cloudinary ${resourceType} delete: ${result.result} — ${publicId}`)
    return { success: ok }
  } catch (error) {
    console.error(`❌ Cloudinary deleteMedia error (${publicId}):`, error.message)
    return { success: false, error: error.message }
  }
}

export default cloudinary