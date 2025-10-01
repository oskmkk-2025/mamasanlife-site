import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { categories as CATS, listByCategoryQuery, countByCategoryQuery } from '@/lib/queries'
import { PostList } from '@/components/PostList'
import { SectionHeader } from '@/components/SectionHeader'
import { Sidebar } from '@/components/Sidebar'
import Script from 'next/script'

export const revalidate = 120

export async function generateStaticParams() {
  return CATS.map(c => ({ category: c.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params
  const cat = CATS.find(c => c.slug === category)
  const title = cat ? `${cat.title}の記事` : 'カテゴリー'
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${category}`
  return { title, alternates: { canonical: url }, openGraph: { url, title } }
}

export default async function CategoryPage(
  { params, searchParams }: {
    params: Promise<{ category: string }>,
    searchParams: Promise<Record<string, string | string[] | undefined>>
  }
) {
  const { category } = await params
  const sp = await searchParams
  const cat = CATS.find(c => c.slug === category)
  if (!cat) return null
  const page = Number(sp?.page ?? 1)
  const PAGE_SIZE = 12
  const offset = (page - 1) * PAGE_SIZE
  const end = offset + PAGE_SIZE
  const [posts, total] = await Promise.all([
    sanityClient.fetch(listByCategoryQuery, { category, offset, end }),
    sanityClient.fetch(countByCategoryQuery, { category })
  ])
  const totalPages = Math.ceil((total || 0) / PAGE_SIZE)
  const qs = (p: number) => new URLSearchParams({ page: String(p) }).toString()

  return (
    <div className="container-responsive py-10 space-y-8">
      <header className="card p-6" style={{ background:'#fff' }}>
        <h1 className="text-3xl font-bold" style={{ color:'#B67352' }}>{cat.title}</h1>
        <p className="text-gray-700 mt-2">最新の記事やおすすめをお届けします。</p>
        <div className="mt-4"><a href={`/${category}?page=1`} className="btn-brand">新着を見る</a></div>
      </header>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          <SectionHeader title="新着記事" />
          <PostList posts={posts.map((p: any) => ({ slug: p.slug, category: p.category, title: p.title, excerpt: p.excerpt, date: p.publishedAt, imageUrl: p.imageUrl }))} />
          <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link className="border rounded-md px-3 py-2 text-sm" href={`/${category}?${qs(page - 1)}`} aria-label="前のページ" rel="prev">前へ</Link>
          )}
          <span className="text-xs text-gray-500">{page} / {totalPages || 1}</span>
          {page < totalPages && (
            <Link className="border rounded-md px-3 py-2 text-sm" href={`/${category}?${qs(page + 1)}`} aria-label="次のページ" rel="next">次へ</Link>
          )}
          </div>
        </div>
        <Sidebar />
      </div>
      <Script id="cat-ld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: cat.title, itemListElement: posts.map((p:any, i:number)=>({ '@type':'ListItem', position: i+1, url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${p.category}/${p.slug}` })) })}
      </Script>
    </div>
  )
}
