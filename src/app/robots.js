// Served as /robots.txt — lets search engines crawl the public site,
// keeps them out of admin, API, exam and personal pages.
const SITE_URL = 'https://www.ldcewarriors.in'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/media/'],
        disallow: ['/admin', '/api/', '/exam/', '/profile', '/auth/', '/materials/read/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
