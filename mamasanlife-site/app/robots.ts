import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  const allow = process.env.NEXT_PUBLIC_NOINDEX === 'true'
    ? []
    : [{
        userAgent: '*',
        allow: '/',
        // 管理・作業用ページはクロール不要（読者向けコンテンツではない）
        // /search と /go は毎回サーバーで動的生成される＝クロールされるとCPU無料枠を食う（2026-08-25）
        disallow: ['/admin', '/api', '/studio', '/fonts-demo', '/staging-preview', '/preview', '/search', '/go']
      }]
  return {
    rules: allow.length ? allow : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${base}/sitemap.xml`
  }
}

