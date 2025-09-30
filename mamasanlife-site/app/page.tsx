import { sanityClient } from '@/lib/sanity.client'
import { categories, latestByCategoryQuery, recentPostsQuery } from '@/lib/queries'
import { PostList } from '@/components/PostList'
import { CategoryTicker } from '@/components/CategoryTicker'
import { SectionHeader } from '@/components/SectionHeader'

export const revalidate = 60

export default async function HomePage() {
  // 1) カテゴリ別：各2件
  const perCat = await Promise.all(
    categories.map(async (c) => ({
      slug: c.slug,
      title: c.title,
      posts: (await sanityClient.fetch(latestByCategoryQuery, { category: c.slug, limit: 2 })).map((p:any)=>({
        slug:p.slug, category:p.category, title:p.title, excerpt:p.excerpt, date:p.publishedAt, imageUrl:p.imageUrl
      }))
    }))
  )
  // 2) 最新記事（トップは最新のみ）
  const latest = await sanityClient.fetch(recentPostsQuery, { limit: 12 })

  return (
    <div>
      <section className="bg-gradient-to-b from-[#FEFBF6] to-white border-b" style={{ borderColor:'#8CB9BD' }}>
        <div className="container-responsive py-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">ママの毎日をちょっとラクに、ちょっとハッピーに</h1>
          <p className="mt-4 text-gray-700">家計・子育て・暮らし・働き方・健康の“いま役立つ”情報をお届けします。</p>
        </div>
      </section>

      {/* グローバルメニューの下：カテゴリ別（2件）を5秒ごとに自動切替 */}
      <CategoryTicker groups={perCat as any} />

      {/* 最新記事のみ */}
      <section className="container-responsive py-12">
        <SectionHeader title="最新記事" />
        <PostList posts={latest.map((p:any)=>({ slug:p.slug, category:p.category, title:p.title, excerpt:p.excerpt, date:p.publishedAt, imageUrl:p.imageUrl }))} />
      </section>
    </div>
  )
}
