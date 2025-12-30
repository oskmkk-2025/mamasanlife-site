import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  const allow = process.env.NEXT_PUBLIC_NOINDEX === 'true' ? [] : [{ userAgent: '*', allow: '/' }]
  return {
    rules: allow.length ? allow : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${base}/sitemap.xml`
  }
}

