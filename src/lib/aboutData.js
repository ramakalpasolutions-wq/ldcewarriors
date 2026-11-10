// src/lib/aboutData.js — server-only loading of the About Us content
import prisma from '@/lib/db'
import { ABOUT_SETTING_KEY, normalizeAbout } from '@/lib/aboutContent'

export async function loadAbout() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: ABOUT_SETTING_KEY } })
    return normalizeAbout(row ? JSON.parse(row.value) : null)
  } catch {
    return normalizeAbout(null)
  }
}

// Counts for the "Numbers" section, taken when the page opens
export async function loadLiveCounts() {
  try {
    const [videos, topics, tests, textbooks, articles] = await Promise.all([
      prisma.video.count({ where: { isActive: true } }),
      prisma.topic.count({ where: { isActive: true } }),
      prisma.quiz.count({ where: { isPublished: true, isArchived: false } }),
      prisma.material.count({ where: { isPublished: true } }),
      prisma.article.count({ where: { isPublished: true } }),
    ])
    return { videos, topics, tests, textbooks, articles }
  } catch {
    return { videos: 0, topics: 0, tests: 0, textbooks: 0, articles: 0 }
  }
}

export async function saveAbout(content) {
  const clean = normalizeAbout(content)
  await prisma.setting.upsert({
    where: { key: ABOUT_SETTING_KEY },
    update: { value: JSON.stringify(clean) },
    create: { key: ABOUT_SETTING_KEY, value: JSON.stringify(clean) },
  })
  return clean
}
