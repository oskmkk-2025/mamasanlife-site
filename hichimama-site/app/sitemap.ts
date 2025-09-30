import type { MetadataRoute } from 'next'
import { sanityClient } from '@/lib/sanity.client'
import { allSlugsQuery, allCategoriesQuery, allTagsQuery } from '@/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const [slugs, categories, tags] = await Promise.all([
    sanityClient.fetch<string[]>(allSlugsQuery).catch(() => []),
    sanityClient.fetch<{ slug: string }[]>(allCategoriesQuery).catch(() => []),
    sanityClient.fetch<{ slug: string }[]>(allTagsQuery).catch(() => [])
  ])

  const staticPages: MetadataRoute.Sitemap = [
    '', '/blog', '/profile', '/contact'
  ].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly', priority: 0.7 }))

  const postPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/blog/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8
  }))

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/blog/category/${encodeURIComponent((c as any).slug)}`,
    changeFrequency: 'weekly',
    priority: 0.6
  }))
  const tagPages: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${base}/blog/tag/${encodeURIComponent((t as any).slug)}`,
    changeFrequency: 'weekly',
    priority: 0.5
  }))

  return [...staticPages, ...postPages, ...categoryPages, ...tagPages]
}
