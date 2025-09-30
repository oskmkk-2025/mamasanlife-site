import { sanityClient } from '@/lib/sanity.client'
import { latestByCategoryQuery } from '@/lib/queries'
import { PostList } from '@/components/PostList'

export const revalidate = 120

export const metadata = { title: '特集', description: '特集記事の一覧' }

export default async function FeaturePage() {
  const posts = await sanityClient.fetch(latestByCategoryQuery, { category: 'feature', limit: 12 })
  return (
    <div className="container-responsive py-10 space-y-8">
      <h1 className="text-2xl font-semibold">特集</h1>
      <PostList posts={posts.map((p: any) => ({ slug: p.slug, category: p.category, title: p.title, excerpt: p.excerpt, date: p.publishedAt, imageUrl: p.imageUrl }))} />
    </div>
  )
}

