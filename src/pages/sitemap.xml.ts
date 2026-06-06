import type { APIRoute } from 'astro'
import { blogPosts } from '../data/blog'
import { caseStudies } from '../data/caseStudies'

const SITE = 'https://swain.pro'

type SitemapPage = {
  url: string
  priority: string
  changefreq: string
  lastmod?: string
}

const staticPages: SitemapPage[] = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/about', priority: '0.9', changefreq: 'monthly' },
  { url: '/projects', priority: '0.9', changefreq: 'weekly' },
  { url: '/case-studies', priority: '0.9', changefreq: 'monthly' },
  { url: '/services', priority: '0.9', changefreq: 'monthly' },
  { url: '/domains', priority: '0.8', changefreq: 'monthly' },
  { url: '/resume', priority: '0.8', changefreq: 'monthly' },
  { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  { url: '/contact', priority: '0.9', changefreq: 'monthly' },
]

export const GET: APIRoute = () => {
  const blogUrls: SitemapPage[] = blogPosts.map(p => ({
    url: `/blog/${p.slug}`,
    lastmod: p.date,
    priority: '0.7',
    changefreq: 'monthly',
  }))

  const caseUrls: SitemapPage[] = caseStudies.map(cs => ({
    url: `/case-studies/${cs.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  }))

  const allPages: SitemapPage[] = [...staticPages, ...blogUrls, ...caseUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    p => `  <url>
    <loc>${SITE}${p.url}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
