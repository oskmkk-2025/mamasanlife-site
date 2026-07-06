import { sanityClient } from '@/lib/sanity.client'
import { categories, latestByCategoryQuery, recentPostsQuery } from '@/lib/queries'
import { PostList } from '@/components/PostList'
import { CategoryTicker } from '@/components/CategoryTicker'
import { SectionHeader } from '@/components/SectionHeader'
import { HeroCard } from '@/components/HeroCard'
import { uniquePostsBySlug, filterBlocked } from '@/lib/post-utils'
import Script from 'next/script'
import { LineStampPromo } from '@/components/LineStampPromo'

export const revalidate = 3600

export const metadata = {
  alternates: { canonical: '/' }
}

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
  <div className="container-responsive py-10 sm:py-32 text-center max-w-5xl mx-auto">
    <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[var(--c-accent)] mb-4 block">FP2級ママの家計改善ブログ</span>
    <h1 className="hero-title text-3xl sm:text-6xl footer:tracking-tight mb-5 sm:mb-6">
      FP2級ママが、<br className="sm:hidden" />固定費を年20万円減らした記録。
    </h1>
    <p className="hero-sub text-gray-500 max-w-2xl mx-auto">
      電気・ガス・通信・保険・ふるさと納税。<br />
      東海エリアに暮らす2児の母が、本当にやってよかった家計改善だけを書いています。
    </p>
    <div className="mt-7 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
      <a
        href="/money/review-of-utility-costs"
        className="inline-block bg-[var(--c-accent)] text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
      >
        家計改善の実例を読む
      </a>
      <a
        href="#popular"
        className="inline-block border border-[var(--c-accent)] text-[var(--c-accent)] px-6 py-3 rounded-md font-medium hover:bg-black/5 transition"
      >
        人気記事から読む
      </a>
    </div>
  </div>
</section>

{/* 人気記事 TOP5（POPULAR） */}
<section id="popular" className="container-responsive py-16">
  <div className="text-center mb-10">
    <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-[var(--c-accent)] mb-2 block">Popular</span>
    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">よく読まれている記事 TOP5</h2>
  </div>
  <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    <li className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
      <span className="text-xs text-[var(--c-accent)] font-bold">No.1 ／ お金・家計管理</span>
      <a href="/money/review-of-utility-costs" className="block mt-2 text-lg font-bold text-gray-900 hover:opacity-70">
        【実例検証】東邦ガス・中部電力のセット契約は損？
      </a>
      <p className="text-sm text-gray-600 mt-2">東海エリアの光熱費を実例で徹底比較。</p>
    </li>
    <li className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
      <span className="text-xs text-[var(--c-accent)] font-bold">No.2 ／ お金・家計管理</span>
      <a href="/money/start-nisa-from-2025" className="block mt-2 text-lg font-bold text-gray-900 hover:opacity-70">
        NISAの始め方｜FP2級ママが教える10分3ステップ【2026年版】
      </a>
      <p className="text-sm text-gray-600 mt-2">迷っている主婦のための最短スタート手順。</p>
    </li>
    <li className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
      <span className="text-xs text-[var(--c-accent)] font-bold">No.3 ／ お金・家計管理</span>
      <a href="/money/rakuten-economic-zone" className="block mt-2 text-lg font-bold text-gray-900 hover:opacity-70">
        楽天経済圏で賢く資産を増やす方法
      </a>
      <p className="text-sm text-gray-600 mt-2">家計と投資をまるごと最適化する考え方。</p>
    </li>
    <li className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
      <span className="text-xs text-[var(--c-accent)] font-bold">No.4 ／ 暮らし・家事</span>
      <a href="/life/rakuten-hometown-tax-2024" className="block mt-2 text-lg font-bold text-gray-900 hover:opacity-70">
        【楽天ふるさと納税】今年大当たりの返礼品5選
      </a>
      <p className="text-sm text-gray-600 mt-2">5と0のつく日を最大限に活かした実例。</p>
    </li>
    <li className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
      <span className="text-xs text-[var(--c-accent)] font-bold">No.5 ／ 子育て・教育</span>
      <a href="/parenting/smartphone-for-junior-high-school-students" className="block mt-2 text-lg font-bold text-gray-900 hover:opacity-70">
        【子どものiPhone設定】失敗しない中学生スマホの持たせ方
      </a>
      <p className="text-sm text-gray-600 mt-2">親子で安心して使える初期設定の決定版。</p>
    </li>
  </ol>
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
