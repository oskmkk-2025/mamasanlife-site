import { Hero } from '@/components/Hero'
import { PostList } from '@/components/PostList'
import { sanityClient } from '@/lib/sanity.client'
import { latestPostsQuery, popularPostsQuery, allCategoriesQuery } from '@/lib/queries'
import { CrownImg } from '@/components/icons/CrownImg'
import { PostmarkImg } from '@/components/icons/PostmarkImg'
import { StrawberryButton } from '@/components/StrawberryButton'

export const revalidate = 60

export default async function HomePage() {
  const [latest, popular, categories] = await Promise.all([
    sanityClient.fetch(latestPostsQuery, { limit: 3 }),
    sanityClient.fetch(popularPostsQuery, { limit: 3 }),
    sanityClient.fetch(allCategoriesQuery)
  ])
  return (
    <div>
      <Hero />
      <section className="container-responsive py-24 text-center">
        <h2 data-reveal className="text-2xl font-semibold mb-6 flex items-center justify-center gap-3">
          NEW Posts
          <span className="sm:hidden"><PostmarkImg size={44} /></span>
          <span className="hidden sm:inline"><PostmarkImg size={64} /></span>
        </h2>
        <PostList posts={latest.map((p: any) => ({ ...p, ribbonLabel: 'NEW', ribbonColor: '#D81A37', ribbonBlink: true }))} />
      </section>
      <section className="container-responsive py-20 text-center">
        <h2 data-reveal className="text-2xl font-semibold mb-6 flex items-center justify-center gap-3">今週のranking <CrownImg size={56} /></h2>
        <PostList posts={popular.map((p: any, i: number) => ({ ...p, rank: i + 1 }))} />
      </section>
      <section className="container-responsive py-24 text-center">
        <h3 className="text-xl font-semibold mb-6">Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
          {(() => {
            const wpFallback = [
              { title: '家計管理', slug: 'household-management' },
              { title: 'エンタメ', slug: 'entertainment' },
              { title: 'ヘルス・学び', slug: 'health-learning' },
              { title: '書籍紹介', slug: 'book-introduction' },
            ]
            const list = (categories && categories.length ? categories.slice(0,4) : wpFallback) as any[]
            return list.map(c => (
              <StrawberryButton key={c.slug} title={c.title} href={`/blog/category/${encodeURIComponent(c.slug)}`} size={110} />
            ))
          })()}
        </div>
      </section>
      {/* Contact section removed as requested */}
    </div>
  )
}
