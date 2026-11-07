
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { signedQuizMediaUrl } from '@/lib/quizMedia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const key = new URL(req.url)
    .searchParams.get('key')

  try {
    const url = await signedQuizMediaUrl(
      key,
      'image',
      300
    )

    return NextResponse.redirect(url, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid image' },
      { status: 400 }
    )
  }
}
