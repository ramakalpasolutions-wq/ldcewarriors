// src/app/api/articles/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const homepage = searchParams.get('homepage')
    const live     = searchParams.get('live')
    const limit    = parseInt(searchParams.get('limit') || '20')
    const page     = parseInt(searchParams.get('page')  || '1')

    const where = { isPublished: true }
    if (homepage === 'true') where.showOnHomepage   = true
    if (live     === 'true') where.showInLiveScroll = true

    const skip = (page - 1) * limit

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id:               true,
          title:            true,
          excerpt:          true,   // Short text only
          thumbnail:        true,   // URL string
          category:         true,
          contentType:      true,
          docxUrl:          true,   // URL string (tiny)
          showOnHomepage:   true,
          showInLiveScroll: true,
          views:            true,
          author:           true,
          createdAt:        true,
          // ✅ manualContent and HTML excluded — never in list responses
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    const mapped = articles.map(a => ({ ...a, _id: a.id }))

    console.log(
      `📰 Articles API: found ${mapped.length} articles ` +
      `(page ${page}, filter: ${JSON.stringify({ homepage, live })})`
    )

    return NextResponse.json({
      success: true,
      articles: mapped,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Articles GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}