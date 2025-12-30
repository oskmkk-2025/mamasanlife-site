import { sanityClient } from '@/lib/sanity.client'
import { categories, latestByCategoryQuery, recentPostsQuery } from '@/lib/queries'
import { PostList } from '@/components/PostList'
import { CategoryTicker } from '@/components/CategoryTicker'
import { SectionHeader } from '@/components/SectionHeader'
import { HeroCard } from '@/components/HeroCard'
import { uniquePostsBySlug, filterBlocked } from '@/lib/post-utils'
import Script from 'next/script'
import { LineStampPromo } from '@/components/LineStampPromo'

export const revalidate = 60

export default async function HomePage() {
  // 取得失敗時に空配列へフォールバック（Internal Server Error を避ける）
  let perCat: { slug: string; title: string; posts: any[] }[] = []
  let latest: any[] = []
  try {
    // 1) カテゴリ別：各2件
    perCat = await Promise.all(
      categories.map(async (c) => ({
        slug: c.slug,
        title: c.title,
        posts: (await sanityClient.fetch(latestByCategoryQuery, { category: c.slug, limit: 2 })).map((p: any) => ({
          slug: p.slug, category: p.category, title: p.title, excerpt: p.excerpt, date: p.publishedAt, imageUrl: p.imageUrl
        }))
      }))
    )
    // 2) 最新記事（トップは最新のみ）
    const latestRaw = await sanityClient.fetch(recentPostsQuery, { limit: 24 })
    const allowed = new Set(categories.map(c => c.slug))
    latest = uniquePostsBySlug(filterBlocked(latestRaw)).filter((p: any) => allowed.has(p?.category)).slice(0, 12)
  } catch (e) {
    console.error('[HomePage] Sanity fetch failed, rendering with empty data', e)
    perCat = categories.map(c => ({ slug: c.slug, title: c.title, posts: [] }))
    latest = []
  }

  // Hero: 特集カテゴリの先頭 or 最新の先頭
  const feature = perCat.find(g => g.slug === 'feature')
  const hero = (feature?.posts?.find((p: any) => filterBlocked([p]).length) || latest?.[0]) as any
  // 画面内の重複（カテゴリ枠/ヒーロー と 最新一覧の重複）を除外
  const shownKeys = new Set<string>()
  if (hero?.slug && hero?.category) shownKeys.add(`${hero.category}/${hero.slug}`)
  for (const g of perCat) {
    for (const p of (g.posts || [])) {
      if (p?.slug && p?.category) shownKeys.add(`${p.category}/${p.slug}`)
    }
  }
  const latestRest = uniquePostsBySlug(filterBlocked((latest || []).filter((p: any) => !shownKeys.has(`${p.category}/${p.slug}`))))

  return (
    <div>
      <section className="bg-white">
        <div className="container-responsive py-24 sm:py-32 text-center max-w-5xl mx-auto">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[var(--c-accent)] mb-4 block">Refined Living</span>
          <h1 className="hero-title text-5xl sm:text-7xl footer:tracking-tight mb-6">Curate your daily life.</h1>
          <p className="hero-sub text-gray-400">選んで整える、わたしの暮らし。</p>
        </div>
      </section>

      {/* ヒーロー（推し記事） */}
      {hero && (
        <section className="container-responsive pb-24">
          <HeroCard post={hero} />
        </section>
      )}

      <div className="mb-24">
        <LineStampPromo />
      </div>

      {/* グローバルメニューの下：カテゴリ別（2件）を自動切替 */}
      <div className="mb-24">
        <CategoryTicker groups={perCat as any} />
      </div>

      {/* 最新記事のみ */}
      <section className="container-responsive pb-32">
        <div className="mb-12">
          <SectionHeader title="Latest Journal" />
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mt-2">最新の記録</p>
        </div>
        <PostList posts={latestRest.map((p: any) => ({ id: p._id, slug: p.slug, category: p.category, categoryTitle: p.categoryTitle, title: p.title, excerpt: p.excerpt, date: p.publishedAt, imageUrl: p.imageUrl }))} />
      </section>

      {/* 検索の“案内所”をサイトに教える（構造化データ） */}
      <Script id="site-ld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Mamasan Life',
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://mamasanmoney-bu.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mamasanmoney-bu.com'}/search?q={query}`,
            'query-input': 'required name=query'
          }
        })}
      </Script>
    </div>
  )
}
