// Served as /sitemap.xml — the public pages search engines should know about.
import prisma from '@/lib/db'

const SITE_URL = 'https://www.ldcewarriors.in'

export const dynamic = 'force-dynamic'

export default async function sitemap() {
  const now = new Date()

  const pages = [
    { path: '/', priority: 1, changeFrequency: 'daily' },
    { path: '/classes/topics', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/quiz', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/materials', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/articles', priority: 0.8, changeFrequency: 'daily' },
    { path: '/join-family', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  ].map(p => ({ url: `${SITE_URL}${p.path}`, lastModified: now, changeFrequency: p.changeFrequency, priority: p.priority }))

  let topicPages = []
  let articlePages = []
  try {
    const [topics, articles] = await Promise.all([
      prisma.topic.findMany({ where: { isActive: true }, select: { id: true, createdAt: true } }),
      prisma.article.findMany({ where: { isPublished: true }, select: { id: true, updatedAt: true } }),
    ])
    topicPages = topics.flatMap(t => [
      { url: `${SITE_URL}/quiz/topic/${t.id}`, lastModified: t.createdAt, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${SITE_URL}/materials/topic/${t.id}`, lastModified: t.createdAt, changeFrequency: 'weekly', priority: 0.7 },
    ])
    articlePages = articles.map(a => ({
      url: `${SITE_URL}/articles/${a.id}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  } catch {
    // If the database is unreachable, still return the main pages
  }

  return [...pages, ...topicPages, ...articlePages]
}
