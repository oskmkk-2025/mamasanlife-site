import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { buildSearchQuery, recentPostsQuery, latestByCategoryQuery, buildCategoryCountQuery, categories as CATS, buildTagQuery, buildTagCountQuery } from '@/lib/queries'
import { uniquePostsBySlug, filterBlocked } from '@/lib/post-utils'
import { PostList } from '@/components/PostList'
import { SectionHeader } from '@/components/SectionHeader'

export const revalidate = 60

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string, tag?: string, sort?: string, days?: string }> }) {
  const sp = await searchParams
  const q = (sp?.q || '').trim()
  const tag = (sp?.tag || '').trim()
  const sort = (sp?.sort || 'new') as 'new' | 'popular'
  const days = (sp?.days || 'all') as 'all' | '30'
  const limit = 30
  const withSince = days === '30'
  const orderPopular = sort === 'popular'
  // eslint-disable-next-line react-hooks/purity
  const since = withSince ? new Date(Date.now() - 30*24*60*60*1000).toISOString() : undefined
  const allowed = new Set(CATS.map(c=>c.slug))

  // 検索モード: tag があればタグ検索、無ければキーワード
  const isTag = !!tag
  let posts: any[] = []
  if (isTag) {
    const qTag = buildTagQuery({ withSince, orderPopular })
    const params:any = { tag, limit }
    if (since) params.since = since
    const raw = await sanityClient.fetch(qTag, params).catch(()=>[])
    posts = uniquePostsBySlug(filterBlocked(raw)).filter((p:any)=> allowed.has(p?.category))
  } else {
    const query = buildSearchQuery({withSince, orderPopular})
    const params:any = { q: q ? `${q}*` : '*', limit }
    if (since) params.since = since
    const raw = q ? await sanityClient.fetch(query, params).catch(()=>[]) : []
    posts = uniquePostsBySlug(filterBlocked(raw)).filter((p:any)=> allowed.has(p?.category))
  }
  const recommendations = q && posts.length === 0
    ? uniquePostsBySlug(filterBlocked(await sanityClient.fetch(recentPostsQuery, { limit: 12 }).catch(()=>[]))).slice(0,6)
    : []
  const catRecs: { slug:string; title:string; posts:any[]; count:number }[] = []
  if (q && posts.length === 0) {
    // eslint-disable-next-line react-hooks/purity
    const since30 = new Date(Date.now() - 30*24*60*60*1000).toISOString()
    const countQuery = buildCategoryCountQuery({ withSince: true })
    const groups = await Promise.all(
      CATS.map(async (c) => {
        const [posts3, count30] = await Promise.all([
          sanityClient.fetch(latestByCategoryQuery, { category: c.slug, limit: 3 }).catch(()=>[]),
          sanityClient.fetch(countQuery, { category: c.slug, since: since30 }).catch(()=>0)
        ])
        return { slug: c.slug, title: c.title, posts: posts3, count: Number(count30)||0 }
      })
    )
    for (const g of groups) if ((g.posts||[]).length) catRecs.push(g)
    // 人気カテゴリ優先（直近30日の記事数が多い順）
    catRecs.sort((a,b)=> (b.count||0) - (a.count||0))
  }
  return (
    <div className="container-responsive py-8 space-y-6">
      <h1 className="text-2xl font-bold text-emphasis">検索結果</h1>
      <form action="/search" method="get" className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
        <input name="q" defaultValue={isTag ? '' : q} placeholder={isTag ? `タグ #${tag} を解除してキーワード検索` : 'キーワードで検索'} className="flex-1 border rounded-md px-3 py-2"/>
        <input type="hidden" name="sort" value={sort}/>
        <input type="hidden" name="days" value={days}/>
        <button className="btn-brand md:w-28">検索</button>
      </form>

      {/* 並び替え/期間（カテゴリと同じUX） */}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="並び替え" className="flex items-center gap-2">
          <Link href={`/search?${new URLSearchParams(isTag ? { tag, sort:'new', days } : { q, sort:'new', days }).toString()}`}
            aria-current={sort==='new' ? 'true' : undefined}
            className={`tab ${sort==='new' ? 'tab--active' : ''}`}>新着順</Link>
          <Link href={`/search?${new URLSearchParams(isTag ? { tag, sort:'popular', days } : { q, sort:'popular', days }).toString()}`}
            aria-current={sort==='popular' ? 'true' : undefined}
            className={`tab ${sort==='popular' ? 'tab--active' : ''}`}>人気順</Link>
        </div>
        <div role="group" aria-label="期間" className="flex items-center gap-2">
          <Link href={`/search?${new URLSearchParams(isTag ? { tag, sort, days:'all' } : { q, sort, days:'all' }).toString()}`}
            aria-current={days==='all' ? 'true' : undefined}
            className={`tab ${days==='all' ? 'tab--active' : ''}`}>全期間</Link>
          <Link href={`/search?${new URLSearchParams(isTag ? { tag, sort, days:'30' } : { q, sort, days:'30' }).toString()}`}
            aria-current={days==='30' ? 'true' : undefined}
            className={`tab ${days==='30' ? 'tab--active' : ''}`}>直近30日</Link>
        </div>
      </div>

      {isTag ? (
        <p className="text-sm text-gray-600">タグ「<span className="font-semibold">#{tag}</span>」の検索結果: {posts.length}件（最大{limit}件） / 並び: {sort==='popular'?'人気':'新着'} / 期間: {days==='30'?'30日':'全期間'}</p>
      ) : q ? (
        <p className="text-sm text-gray-600">「{q}」の検索結果: {posts.length}件（最大{limit}件） / 並び: {sort==='popular'?'人気':'新着'} / 期間: {days==='30'?'30日':'全期間'}</p>
      ) : null}

      {isTag || q ? (
        <section className="py-2">
          <PostList posts={posts.map((p:any)=>({ id:p._id, slug:p.slug, category:p.category, categoryTitle:p.categoryTitle, title:p.title, excerpt:p.excerpt, date:p.publishedAt, imageUrl:p.imageUrl }))} />
        </section>
      ) : (
        <p className="text-sm text-gray-600">キーワードを入力して検索してください。</p>
      )}

      {(isTag || q) && posts.length === 0 && (
        <section className="py-6">
          <p className="text-sm text-gray-600">該当する記事は見つかりませんでした。代わりに最新記事をご案内します。</p>
          <div className="mt-4">
            <SectionHeader title="新着おすすめ" />
            <PostList posts={recommendations.map((p:any)=>({ id:p._id, slug:p.slug, category:p.category, categoryTitle:p.categoryTitle, title:p.title, excerpt:p.excerpt, date:p.publishedAt, imageUrl:p.imageUrl }))} />
          </div>
          {catRecs.length > 0 && (
            <div className="mt-8 space-y-8">
              <SectionHeader title="カテゴリ別おすすめ" />
              <div className="grid md:grid-cols-2 gap-8">
                {catRecs.slice(0,3).map(g => (
                  <div key={g.slug} className="min-w-0">
                    <h3 className="text-lg font-semibold mb-3" style={{ color:'#B67352' }}>{g.title} <span className="text-xs text-gray-500">({g.count})</span></h3>
                    <PostList posts={g.posts.slice(0,2).map((p:any)=>({ id:p._id, slug:p.slug, category:p.category, categoryTitle:p.categoryTitle, title:p.title, excerpt:p.excerpt, date:p.publishedAt, imageUrl:p.imageUrl }))} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
