import { sanityClient } from '@/lib/sanity.client'
import { countPostsQuery, listPostsQuery } from '@/lib/queries'
import { PostList } from '@/components/PostList'
import Link from 'next/link'
import { PageHeader } from '@/components/PageHeader'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Script from 'next/script'

export const revalidate = 60

const PAGE_SIZE = 9

export async function generateMetadata({ params }: { params: { category: string } }) {
  const title = `カテゴリー: ${decodeURIComponent(params.category)}`
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/blog/category/${encodeURIComponent(params.category)}`
  return { title, alternates: { canonical: url }, openGraph: { url, title } }
}

export default async function CategoryPage({ params, searchParams }: { params: { category: string }, searchParams: Record<string, string | string[] | undefined> }) {
  const page = Number(searchParams.page ?? 1)
  const offset = (page - 1) * PAGE_SIZE
  const end = offset + PAGE_SIZE
  const category = params.category

  const paramsList: Record<string, any> = { offset, end, category }
  const paramsCount: Record<string, any> = { category }
  const [posts, total] = await Promise.all([
    sanityClient.fetch(listPostsQuery, { ...paramsList, q: null, tag: null } as any),
    sanityClient.fetch(countPostsQuery, { ...paramsCount, q: null, tag: null } as any)
  ])
  const totalPages = Math.ceil((total || 0) / PAGE_SIZE)

  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  return (
    <div>
      <PageHeader title={`カテゴリー: ${category}`} />
      <div className="container-responsive py-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }, { label: `カテゴリー: ${category}` }]} />
        <PostList posts={posts} />
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link className="border rounded-md px-3 py-2 text-sm" href={`/blog/category/${category}?page=${page - 1}`} aria-label="前のページ" rel="prev">
              前へ
            </Link>
          )}
          <span className="text-xs text-gray-500">{page} / {totalPages || 1}</span>
          {page < totalPages && (
            <Link className="border rounded-md px-3 py-2 text-sm" href={`/blog/category/${category}?page=${page + 1}`} aria-label="次のページ" rel="next">
              次へ
            </Link>
          )}
        </div>
        <Script id="cat-ld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `カテゴリー: ${category}`,
            url: `${base}/blog/category/${encodeURIComponent(category)}`
          })}
        </Script>
      </div>
    </div>
  )
}
