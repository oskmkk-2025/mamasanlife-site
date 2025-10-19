import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { categories as CATS, buildCategoryQuery, buildCategoryCountQuery, postBySlugAnyCategoryQuery } from '@/lib/queries'
import { PostList } from '@/components/PostList'
import { SectionHeader } from '@/components/SectionHeader'
import { Sidebar } from '@/components/Sidebar'
import { uniquePostsBySlugCategory, filterBlocked } from '@/lib/post-utils'
import { sanityImageRefToUrl } from '@/lib/image-util'
import Script from 'next/script'
import { Breadcrumbs } from '@/components/Breadcrumbs'

// 一時的に強制動的化して、画像フォールバック反映を即時確認
export const dynamic = 'force-dynamic'

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
  const sort = (sp?.sort as string) || 'new'
  const days = (sp?.days as string) || 'all'
  const withSince = days === '30'
  const orderPopular = sort === 'popular'
  const since = withSince ? new Date(Date.now() - 30*24*60*60*1000).toISOString() : undefined
  const cat = CATS.find(c => c.slug === category)
  if (!cat) return null
  const page = Number(sp?.page ?? 1)
  const PAGE_SIZE = 12
  const offset = (page - 1) * PAGE_SIZE
  const end = offset + PAGE_SIZE
  const listQuery = buildCategoryQuery({withSince, orderPopular})
  const countQuery = buildCategoryCountQuery({withSince})
  const paramsQ:any = { category, offset, end }
  if (since) paramsQ.since = since
  const [postsRaw, total] = await Promise.all([
    sanityClient.fetch(listQuery, paramsQ),
    sanityClient.fetch(countQuery, since ? { category, since } : { category })
  ])
  let posts = uniquePostsBySlugCategory(filterBlocked(postsRaw))
  // 画像フォールバック: 一覧用imageUrlが空のものは本文から1枚目を探索
  const needImage = posts.filter((p:any)=> !p?.imageUrl)
  if (needImage.length){
    const filled: Record<string,string> = {}
    await Promise.all(needImage.map(async (p:any)=>{
      const full = await sanityClient.fetch(postBySlugAnyCategoryQuery, { slug: p.slug }).catch(()=>null)
      if (!full) return
      let url = full?.imageUrl || ''
      if (!url && Array.isArray(full?.body)){
        const body = full.body as any[]
        // find first image-like
        const img = body.find(b=> b?._type==='image' && b?.asset?._ref)
        if (img?.asset?._ref) url = sanityImageRefToUrl(img.asset._ref, { q:80, fit:'clip' })
        if (!url){
          const lib = body.find(b=> b?._type==='linkImageBlock' && typeof b?.src==='string' && !/blogmura|with2\.net|appreach|nabettu\.github\.io/.test(String(b.src)))
          if (lib?.src) url = String(lib.src)
        }
        if (!url){
          const row = body.find(b=> b?._type==='linkImageRow' && Array.isArray(b?.items) && b.items[0]?.src && !/blogmura|with2\.net|appreach|nabettu\.github\.io/.test(String(b.items[0].src)))
          if (row?.items?.[0]?.src) url = String(row.items[0].src)
        }
      }
      if (url) filled[`${p.category}/${p.slug}`] = url
    }))
    posts = posts.map((p:any)=> filled[`${p.category}/${p.slug}`] ? ({ ...p, imageUrl: filled[`${p.category}/${p.slug}`] }) : p)
  }
  const totalPages = Math.ceil((total || 0) / PAGE_SIZE)
  const qs = (p: number) => new URLSearchParams({ page: String(p), sort, days }).toString()
  const filterLink = (next: { sort?: string; days?: string }) => {
    const s = next.sort ?? sort
    const d = next.days ?? days
    const params = new URLSearchParams({ sort: s, days: d, page: '1' })
    return `/${category}?${params.toString()}`
  }
  const sinceLabel = withSince ? '直近30日' : '全期間'

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: cat.title }
  ]

  return (
    <div className="container-responsive py-10 space-y-8">
      <Breadcrumbs items={crumbs} />
      <header className="card p-6" style={{ background:'#fff' }}>
        <h1 className="text-3xl font-bold title-display">{cat.title}</h1>
        <p className="text-gray-700 mt-2">{sinceLabel}の{orderPopular ? '人気順' : '新着順'}で表示しています（{total}件）。</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div role="group" aria-label="並び替え" className="flex items-center gap-2">
            <Link href={filterLink({ sort: 'new' })}
              aria-current={sort==='new' ? 'true' : undefined}
              className={`tab ${sort==='new' ? 'tab--active' : ''}`}>新着順</Link>
            <Link href={filterLink({ sort: 'popular' })}
              aria-current={sort==='popular' ? 'true' : undefined}
              className={`tab ${sort==='popular' ? 'tab--active' : ''}`}>人気順</Link>
          </div>
          <div role="group" aria-label="期間" className="flex items-center gap-2">
            <Link href={filterLink({ days: 'all' })}
              aria-current={days==='all' ? 'true' : undefined}
              className={`tab ${days==='all' ? 'tab--active' : ''}`}>全期間</Link>
            <Link href={filterLink({ days: '30' })}
              aria-current={days==='30' ? 'true' : undefined}
              className={`tab ${days==='30' ? 'tab--active' : ''}`}>直近30日</Link>
          </div>
        </div>
      </header>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          <SectionHeader title={sort==='popular' ? '人気記事' : '新着記事'} />
          <PostList posts={posts.map((p: any) => ({ id:p._id, slug: p.slug, category: p.category, categoryTitle:p.categoryTitle, title: p.title, excerpt: p.excerpt, date: p.publishedAt, imageUrl: p.imageUrl }))} />
          <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link className="border rounded-md px-3 py-2 text-sm" href={`/${category}?${qs(page - 1)}`} aria-label={`前のページ（ページ${page-1}）`} rel="prev">前へ</Link>
          )}
          <span className="text-xs text-gray-500">{page} / {totalPages || 1}</span>
          {page < totalPages && (
            <Link className="border rounded-md px-3 py-2 text-sm" href={`/${category}?${qs(page + 1)}`} aria-label={`次のページ（ページ${page+1}）`} rel="next">次へ</Link>
          )}
          </div>
        </div>
        <Sidebar />
      </div>
      <Script id="cat-ld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: cat.title, itemListElement: posts.map((p:any, i:number)=>({ '@type':'ListItem', position: i+1, url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${p.category}/${p.slug}` })) })}
      </Script>
      <Script id="cat-bc-ld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type':'ListItem', position:1, name:'Home', item: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/` },
            { '@type':'ListItem', position:2, name: cat.title, item: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${category}` }
          ]
        })}
      </Script>
    </div>
  )
}
