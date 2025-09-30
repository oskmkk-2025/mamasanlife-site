import Link from 'next/link'
import { SearchBox } from '@/components/SearchBox'
import { PostList } from '@/components/PostList'
import { FeaturedPost } from '@/components/FeaturedPost'
import { sanityClient } from '@/lib/sanity.client'
import { countPostsQuery, listPostsQuery, allCategoriesQuery, allTagsQuery, featuredPostQuery, latestOtherByDifferentCategoriesQuery } from '@/lib/queries'
import { CategoryFilter, TagFilter } from './filters'
import { PageHeader } from '@/components/PageHeader'
import Script from 'next/script'

export const revalidate = 60

const PAGE_SIZE = 9

export const metadata = {
  title: 'ブログ',
  description: '最新の記事、カテゴリ、タグから目的の記事を探せます。',
}

export default async function BlogIndex({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const page = Number(searchParams.page ?? 1)
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined
  const tag = typeof searchParams.tag === 'string' ? searchParams.tag : undefined
  const offset = (page - 1) * PAGE_SIZE
  const end = offset + PAGE_SIZE

  const listParams: Record<string, any> = { offset, end, q: q ?? null, category: category ?? null, tag: tag ?? null }
  const countParams: Record<string, any> = { q: q ?? null, category: category ?? null, tag: tag ?? null }

  const specialLayout = !q && !category && !tag && page === 1

  let posts: any[] = []
  let total = 0
  let featured: any | null = null
  let others: any[] = []

  if (specialLayout) {
    featured = await sanityClient.fetch(featuredPostQuery)
    if (featured) {
      const cats = (featured.categories || []).map((c: any) => c.slug)
      others = await sanityClient.fetch(latestOtherByDifferentCategoriesQuery, {
        excludeSlug: featured.slug,
        cats,
        limit: 3
      })
    }
    ;[posts, total] = await Promise.all([
      sanityClient.fetch(listPostsQuery, { offset, end, q: null, category: null, tag: null } as any),
      sanityClient.fetch(countPostsQuery, { q: null, category: null, tag: null } as any)
    ])
  } else {
    ;[posts, total] = await Promise.all([
      sanityClient.fetch(listPostsQuery, listParams),
      sanityClient.fetch(countPostsQuery, countParams)
    ])
  }

  const totalPages = Math.ceil((total || 0) / PAGE_SIZE)
  const [categories, tags] = await Promise.all([
    sanityClient.fetch(allCategoriesQuery),
    sanityClient.fetch(allTagsQuery)
  ])

  const qs = (p: number) => {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (category) sp.set('category', category)
    if (tag) sp.set('tag', tag)
    sp.set('page', String(p))
    return sp.toString()
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || ''

  return (
    <div>
      <PageHeader title="ブログ" subtitle="検索・カテゴリ・タグで記事を探せます" />
      <div className="container-responsive py-8 space-y-8">
        <div className="md:sticky md:top-20 z-10 bg-white/70 backdrop-blur border rounded-md p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="sr-only">検索</span>
            <SearchBox />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <CategoryFilter items={categories} selected={category} />
            <TagFilter items={tags} selected={tag} />
          </div>
        </div>
      {specialLayout && featured ? (
        <div className="grid md:grid-cols-[2fr_1fr] gap-6">
          <FeaturedPost slug={featured.slug} title={featured.title} excerpt={featured.excerpt} date={featured.publishedAt} imageUrl={featured.imageUrl} />
          <div className="space-y-4">
            {others?.slice(0,3).map((p: any, i: number) => (
              <div key={p.slug} data-reveal style={{ ['--delay' as any]: `${i * 80}ms` }} className="border rounded-lg overflow-hidden bg-white/80">
                <Link href={`/blog/${p.slug}`} className="block p-4">
                  <div className="text-sm text-gray-500">
                    {p.publishedAt && new Date(p.publishedAt).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="mt-1 font-semibold text-gray-900 line-clamp-2">{p.title}</div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <PostList posts={posts} />
      )}
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link className="border rounded-md px-3 py-2 text-sm" href={`/blog?${qs(page - 1)}`} aria-label="前のページ" rel="prev">
              前へ
            </Link>
          )}
          <span className="text-xs text-gray-500">{page} / {totalPages || 1}</span>
          {page < totalPages && (
            <Link className="border rounded-md px-3 py-2 text-sm" href={`/blog?${qs(page + 1)}`} aria-label="次のページ" rel="next">
              次へ
            </Link>
          )}
        </div>
        <Script id="blog-ld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'ブログ',
            url: `${base}/blog`
          })}
        </Script>
      </div>
    </div>
  )
}
