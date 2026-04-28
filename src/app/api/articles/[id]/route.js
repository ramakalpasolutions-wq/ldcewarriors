// src/app/api/articles/[id]/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req, { params }) {
  try {
    const { id } = await params

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 })
    }

    // Get article (increment views)
    const article = await prisma.article.update({
      where: { id },
      data:  { views: { increment: 1 } },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    let htmlContent = ''

    // ─── If DOCX article: fetch from Cloudinary and parse ──
    if (article.contentType === 'docx' && article.docxUrl) {
      try {
        console.log(`📄 Fetching DOCX from Cloudinary for article: ${article.id}`)

        // Fetch the DOCX file from Cloudinary
        const docxResponse = await fetch(article.docxUrl, {
          next: { revalidate: 3600 }, // Cache for 1 hour
        })

        if (!docxResponse.ok) {
          throw new Error(`Failed to fetch DOCX: ${docxResponse.status}`)
        }

        const arrayBuffer = await docxResponse.arrayBuffer()
        const buffer      = Buffer.from(arrayBuffer)

        // Parse DOCX to HTML
        const mammoth = await import('mammoth')
        const result  = await mammoth.default.convertToHtml(
          { buffer },
          {
            styleMap: [
              "p[style-name='Heading 1'] => h2:fresh",
              "p[style-name='Heading 2'] => h3:fresh",
              "p[style-name='Heading 3'] => h4:fresh",
              "p[style-name='Title']     => h1:fresh",
              "p[style-name='Subtitle']  => h2.subtitle:fresh",
              "b      => strong",
              "i      => em",
              "u      => u",
              "strike => s",
              "p[style-name='List Paragraph'] => li:fresh",
            ],
          }
        )

        htmlContent = result.value
          .replace(/<p>\s*<\/p>/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .replace(
            /<img /g,
            '<img style="max-width:100%;height:auto;border-radius:8px;margin:16px 0;" '
          )
          .trim()

        console.log(`✅ DOCX parsed on-demand: ${htmlContent.length} chars`)
      } catch (parseErr) {
        console.error('❌ Failed to parse DOCX on-demand:', parseErr.message)
        htmlContent = `
          <div style="padding:20px;background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;text-align:center;">
            <p style="color:#DC2626;font-weight:600;">Could not load article content.</p>
            <p style="color:#6B7280;font-size:14px;margin-top:8px;">
              <a href="${article.docxUrl}" download style="color:#C94A44;font-weight:700;">
                📄 Download original DOCX file
              </a>
            </p>
          </div>
        `
      }
    } else if (article.contentType === 'manual' && article.manualContent) {
      // Manual content — return as-is
      htmlContent = article.manualContent
    }

    // Return article with parsed content (never stored in MongoDB)
    return NextResponse.json({
      success: true,
      article: {
        ...article,
        _id:     article.id,
        content: htmlContent, // Parsed on-demand, not from DB
      },
    })
  } catch (error) {
    console.error('Article detail error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 })
  }
}