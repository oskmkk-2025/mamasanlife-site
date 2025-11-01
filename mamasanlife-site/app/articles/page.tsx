import { Suspense } from 'react'
import { sanityClient } from '@/lib/sanity.client'
import { categories, recentPostsQuery } from '@/lib/queries'
import { uniquePostsBySlug, filterBlocked } from '@/lib/post-utils'
import { FilterablePostList } from '@/components/FilterablePostList'

export const revalidate = 60

export const metadata = {
  title: '記事一覧',
  description: 'カテゴリ別にボタンで絞り込める記事一覧ページ',
}

export default async function ArticlesPage() {
  let posts: any[] = []
  try {
    const raw = await sanityClient.fetch(recentPostsQuery, { limit: 500 })
    const allowed = new Set(categories.map(c=>c.slug))
    posts = uniquePostsBySlug(filterBlocked(raw)).filter((p:any)=> allowed.has(p?.category)).map((p:any) => ({
      id: p?._id,
      slug: p.slug,
      category: p.category,
      categoryTitle: p.categoryTitle,
      title: p.title,
      excerpt: p.excerpt,
      date: p.publishedAt,
      imageUrl: p.imageUrl,
    }))
  } catch (e) {
    console.error('[ArticlesPage] Sanity fetch failed', e)
    posts = []
  }

  return (
    <div className="container-responsive py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">記事一覧</h1>
      <Suspense fallback={<p className="text-sm text-gray-500">絞り込みを読み込んでいます…</p>}>
        <FilterablePostList posts={posts as any} categories={categories as any} />
      </Suspense>
    </div>
  )
}
