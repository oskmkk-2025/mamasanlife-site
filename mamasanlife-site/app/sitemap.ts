import type { MetadataRoute } from 'next'
import { sanityClient } from '@/lib/sanity.client'
import { allPostSlugsQuery } from '@/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  const posts: { slug: string; category: string; updatedAt?: string; _updatedAt?: string; publishedAt?: string }[] = await sanityClient.fetch(allPostSlugsQuery).catch(() => [])
  const staticPages: MetadataRoute.Sitemap = [ '', '/feature', '/about', '/policy', '/terms', '/contact', '/disclaimer' ]
    .map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly', priority: 0.7 }))
  const postPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/${p.category}/${p.slug}`,
    // lastmodがあるとGoogleが更新記事を優先的に再クロールしてくれる
    lastModified: p.updatedAt || p._updatedAt || p.publishedAt,
    changeFrequency: 'weekly',
    priority: 0.8
  }))
  return [...staticPages, ...postPages]
}
