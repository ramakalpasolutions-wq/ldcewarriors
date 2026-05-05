// src/app/api/admin/articles/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'
import { uploadImage, deleteImage, uploadRawFile, deleteRawFile } from '@/lib/cloudinary'

/* ─────────────────────────────────────────
   Helper: parse + upload DOCX
───────────────────────────────────────── */
async function processDocx(docxFile, existingPublicId = null) {
  const fileName = docxFile.name || 'document.docx'
  const isDocx =
    docxFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc')

  if (!isDocx) throw new Error('Only .docx files are supported')
  if (docxFile.size > 20 * 1024 * 1024) throw new Error('DOCX file must be under 20MB')

  const arrayBuffer = await docxFile.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  // Delete old file from Cloudinary first
  if (existingPublicId) {
    await deleteRawFile(existingPublicId).catch(e =>
      console.warn('⚠️ Old DOCX delete failed (non-blocking):', e.message)
    )
  }

  console.log(`📄 Uploading DOCX: "${fileName}" (${(docxFile.size / 1024).toFixed(1)} KB)`)
  const uploadResult = await uploadRawFile(buffer, fileName, 'ldce/articles/documents')
  console.log(`✅ DOCX uploaded: ${uploadResult.url}`)

  // Auto-excerpt
  let autoExcerpt = null
  try {
    const mammoth = await import('mammoth')
    const result  = await mammoth.default.extractRawText({ buffer })
    const raw     = result.value.trim()
    autoExcerpt   = raw.substring(0, 200) + (raw.length > 200 ? '...' : '')
  } catch (e) {
    console.warn('⚠️ Excerpt extraction failed:', e.message)
  }

  return {
    docxUrl:      uploadResult.url,
    docxPublicId: uploadResult.publicId,
    autoExcerpt,
  }
}

/* ─────────────────────────────────────────
   Helper: upload thumbnail
───────────────────────────────────────── */
async function processThumbnail(thumbnailFile, existingPublicId = null) {
  if (!thumbnailFile || thumbnailFile.size === 0) return null
  if (thumbnailFile.size > 5 * 1024 * 1024) throw new Error('Thumbnail must be under 5MB')

  // Delete old thumbnail
  if (existingPublicId) {
    await deleteImage(existingPublicId).catch(e =>
      console.warn('⚠️ Old thumbnail delete failed (non-blocking):', e.message)
    )
  }

  const buffer  = await thumbnailFile.arrayBuffer()
  const base64  = `data:${thumbnailFile.type};base64,${Buffer.from(buffer).toString('base64')}`
  const result  = await uploadImage(base64, 'ldce/articles/thumbnails')
  console.log(`✅ Thumbnail uploaded: ${result.url}`)
  return { url: result.url, publicId: result.publicId }
}

/* ═══════════════════════════════════════════════════════════
   GET  /api/admin/articles
   Returns all articles (without manualContent for performance)
═══════════════════════════════════════════════════════════ */
export async function GET(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:                true,
        title:             true,
        excerpt:           true,
        thumbnail:         true,
        thumbnailPublicId: true,
        docxUrl:           true,
        docxPublicId:      true,
        contentType:       true,
        category:          true,
        tags:              true,
        showOnHomepage:    true,
        showInLiveScroll:  true,
        isPublished:       true,
        views:             true,
        author:            true,
        createdAt:         true,
        updatedAt:         true,
        // manualContent intentionally excluded — too large for list view
      },
    })

    return NextResponse.json({
      success:  true,
      articles: articles.map(a => ({ ...a, _id: a.id })),
    })
  } catch (error) {
    console.error('❌ Admin articles GET:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

/* ═══════════════════════════════════════════════════════════
   GET  /api/admin/articles?id=xxx
   Returns a single article INCLUDING manualContent (for edit form)
═══════════════════════════════════════════════════════════ */
export async function GET_ONE(id) {
  // Called internally — not an HTTP handler
  return prisma.article.findUnique({ where: { id } })
}

/* ═══════════════════════════════════════════════════════════
   POST  /api/admin/articles
   Create a new article (DOCX upload or manual HTML)
═══════════════════════════════════════════════════════════ */
export async function POST(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData       = await req.formData()
    const title          = formData.get('title')?.toString().trim()
    const excerpt        = formData.get('excerpt')?.toString().trim() || null
    const category       = formData.get('category')?.toString().trim() || null
    const showOnHomepage   = formData.get('showOnHomepage')   === 'true'
    const showInLiveScroll = formData.get('showInLiveScroll') === 'true'
    const thumbnailFile  = formData.get('thumbnail')
    const docxFile       = formData.get('docxFile')
    const manualContent  = formData.get('content')?.toString().trim() || ''

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    let docxUrl        = null
    let docxPublicId   = null
    let finalExcerpt   = excerpt
    let contentType    = 'manual'
    let manualHtml     = null

    /* ── DOCX branch ── */
    if (docxFile && docxFile.size > 0) {
      try {
        const result = await processDocx(docxFile)
        docxUrl      = result.docxUrl
        docxPublicId = result.docxPublicId
        contentType  = 'docx'
        if (!finalExcerpt && result.autoExcerpt) finalExcerpt = result.autoExcerpt
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 400 }
        )
      }

    /* ── Manual branch ── */
    } else if (manualContent) {
      manualHtml  = manualContent
      contentType = 'manual'
      if (!finalExcerpt) {
        const text   = manualContent.replace(/<[^>]*>/g, '').trim()
        finalExcerpt = text.substring(0, 200) + (text.length > 200 ? '...' : '')
      }

    } else {
      return NextResponse.json(
        { success: false, error: 'Either a DOCX file or manual content is required' },
        { status: 400 }
      )
    }

    /* ── Thumbnail ── */
    let thumbnailUrl      = null
    let thumbnailPublicId = null
    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        const result      = await processThumbnail(thumbnailFile)
        thumbnailUrl      = result?.url      ?? null
        thumbnailPublicId = result?.publicId ?? null
      } catch (err) {
        // Rollback DOCX upload if thumbnail fails hard
        if (docxPublicId) await deleteRawFile(docxPublicId).catch(() => {})
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 400 }
        )
      }
    }

    /* ── Persist ── */
    const article = await prisma.article.create({
      data: {
        title,
        excerpt:           finalExcerpt   || null,
        category,
        thumbnail:         thumbnailUrl,
        thumbnailPublicId,
        docxUrl,
        docxPublicId,
        manualContent:     manualHtml     || null,
        contentType,
        showOnHomepage,
        showInLiveScroll,
        isPublished:       true,
      },
    })

    console.log('✅ Article created:', {
      id:          article.id,
      contentType: article.contentType,
      hasDocx:     !!article.docxUrl,
    })

    return NextResponse.json(
      { success: true, article: { ...article, _id: article.id } },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Article create:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    )
  }
}

/* ═══════════════════════════════════════════════════════════
   PUT  /api/admin/articles
   Update metadata + optional manual content (JSON body)
   Used for:
     • toggle showOnHomepage / showInLiveScroll
     • update title / excerpt / category
     • replace manual HTML content
═══════════════════════════════════════════════════════════ */
export async function PUT(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, _id, manualContent, contentType, ...rest } = body
    const articleId = id || _id

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'Article ID required' },
        { status: 400 }
      )
    }

    // Build update payload — only include defined fields
    const updateData = {
      ...rest,
      updatedAt: new Date(),
    }

    // Allow manual content replacement
    if (manualContent !== undefined) {
      updateData.manualContent = manualContent
      updateData.contentType   = 'manual'

      // Re-derive excerpt if not explicitly supplied
      if (!updateData.excerpt && manualContent) {
        const text           = manualContent.replace(/<[^>]*>/g, '').trim()
        updateData.excerpt   = text.substring(0, 200) + (text.length > 200 ? '...' : '')
      }
    }

    // Explicit contentType override (e.g. switching back to 'docx' after upload via PATCH)
    if (contentType !== undefined && manualContent === undefined) {
      updateData.contentType = contentType
    }

    // Safety — never overwrite file fields through this route
    delete updateData.docxUrl
    delete updateData.docxPublicId
    delete updateData.thumbnail
    delete updateData.thumbnailPublicId

    const article = await prisma.article.update({
      where: { id: articleId },
      data:  updateData,
    })

    console.log('✅ Article updated (PUT):', articleId)

    return NextResponse.json({
      success: true,
      article: { ...article, _id: article.id },
    })
  } catch (error) {
    console.error('❌ Article PUT:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

/* ═══════════════════════════════════════════════════════════
   PATCH  /api/admin/articles
   Update article with file replacements (FormData)
   Used for:
     • Replace DOCX file
     • Replace thumbnail
     • + any metadata changes
═══════════════════════════════════════════════════════════ */
export async function PATCH(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData       = await req.formData()
    const id             = formData.get('id')?.toString()
    const title          = formData.get('title')?.toString().trim()          || undefined
    const excerpt        = formData.get('excerpt')?.toString().trim()        || null
    const category       = formData.get('category')?.toString().trim()      || null
    const showOnHomepage   = formData.has('showOnHomepage')
      ? formData.get('showOnHomepage') === 'true' : undefined
    const showInLiveScroll = formData.has('showInLiveScroll')
      ? formData.get('showInLiveScroll') === 'true' : undefined
    const docxFile       = formData.get('docxFile')
    const thumbnailFile  = formData.get('thumbnail')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Article ID required' },
        { status: 400 }
      )
    }

    /* ── Fetch existing record ── */
    const existing = await prisma.article.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    const updateData = { updatedAt: new Date() }

    // Metadata
    if (title          !== undefined) updateData.title          = title
    if (excerpt        !== undefined) updateData.excerpt        = excerpt
    if (category       !== undefined) updateData.category       = category
    if (showOnHomepage   !== undefined) updateData.showOnHomepage   = showOnHomepage
    if (showInLiveScroll !== undefined) updateData.showInLiveScroll = showInLiveScroll

    /* ── Replace DOCX ── */
    if (docxFile && docxFile.size > 0) {
      try {
        const result = await processDocx(docxFile, existing.docxPublicId)
        updateData.docxUrl      = result.docxUrl
        updateData.docxPublicId = result.docxPublicId
        updateData.contentType  = 'docx'
        // Re-extract excerpt only if not explicitly provided
        if (!excerpt && result.autoExcerpt) updateData.excerpt = result.autoExcerpt
        // Clear old manual content
        updateData.manualContent = null
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 400 }
        )
      }
    }

    /* ── Replace thumbnail ── */
    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        const result = await processThumbnail(thumbnailFile, existing.thumbnailPublicId)
        if (result) {
          updateData.thumbnail         = result.url
          updateData.thumbnailPublicId = result.publicId
        }
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 400 }
        )
      }
    }

    /* ── Persist ── */
    const article = await prisma.article.update({
      where: { id },
      data:  updateData,
    })

    console.log('✅ Article updated (PATCH):', {
      id,
      replacedDocx:      !!updateData.docxUrl,
      replacedThumbnail: !!updateData.thumbnail,
    })

    return NextResponse.json({
      success: true,
      article: { ...article, _id: article.id },
    })
  } catch (error) {
    console.error('❌ Article PATCH:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

/* ═══════════════════════════════════════════════════════════
   DELETE  /api/admin/articles?id=xxx
   Delete article + clean up Cloudinary assets
═══════════════════════════════════════════════════════════ */
export async function DELETE(req) {
  try {
    const admin = requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Article ID required' },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({ where: { id } })
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    /* ── Clean up Cloudinary assets in parallel ── */
    const cleanupResults = await Promise.allSettled([
      article.thumbnailPublicId
        ? deleteImage(article.thumbnailPublicId)
        : Promise.resolve('no-thumbnail'),
      article.docxPublicId
        ? deleteRawFile(article.docxPublicId)
        : Promise.resolve('no-docx'),
    ])

    cleanupResults.forEach((r, i) => {
      const label = i === 0 ? 'thumbnail' : 'DOCX'
      if (r.status === 'rejected') {
        console.warn(`⚠️ Cloudinary ${label} delete failed (non-blocking):`, r.reason?.message)
      } else if (r.value !== 'no-thumbnail' && r.value !== 'no-docx') {
        console.log(`✅ Cloudinary ${label} deleted`)
      }
    })

    await prisma.article.delete({ where: { id } })
    console.log('✅ Article deleted:', id)

    return NextResponse.json({ success: true, message: 'Article deleted successfully' })
  } catch (error) {
    console.error('❌ Article delete:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}