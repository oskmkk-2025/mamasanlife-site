import type { MetadataRoute } from 'next'
import { sanityClient } from '@/lib/sanity.client'
import { allPostSlugsQuery } from '@/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  const posts: { slug: string; category: string }[] = await sanityClient.fetch(allPostSlugsQuery).catch(() => [])
  const staticPages: MetadataRoute.Sitemap = [ '', '/feature', '/about', '/policy', '/terms', '/contact', '/disclaimer' ]
    .map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly', priority: 0.7 }))
  const postPages: MetadataRoute.Sitemap = posts.map((p) => ({ url: `${base}/${p.category}/${p.slug}`, changeFrequency: 'weekly', priority: 0.8 }))
  return [...staticPages, ...postPages]
}
