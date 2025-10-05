import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { buildSearchQuery } from '@/lib/queries'

export const revalidate = 60

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string, sort?: string, days?: string, tag?: string | string[] }> }) {
  const sp = await searchParams
  const q = (sp?.q || '').trim()
  const sort = (sp?.sort || 'new') as 'new' | 'popular'
  const days = (sp?.days || 'all') as 'all' | '30'
  const limit = 30
  const withSince = days === '30'
  const orderPopular = sort === 'popular'
  const since = withSince ? new Date(Date.now() - 30*24*60*60*1000).toISOString() : undefined
  const query = buildSearchQuery({withSince, orderPopular})
  const params:any = { q: q ? `${q}*` : '*', limit }
  if (since) params.since = since
  const posts = q ? await sanityClient.fetch(query, params).catch(()=>[]) : []
  return (
    <div className="container-responsive py-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color:'#B67352' }}>検索結果</h1>
      <form action="/search" method="get" className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
        <input name="q" defaultValue={q} placeholder="キーワードで検索" className="flex-1 border rounded-md px-3 py-2"/>
        <select name="sort" defaultValue={sort} className="border rounded-md px-2 py-2 md:w-40">
          <option value="new">新着順</option>
          <option value="popular">人気順</option>
        </select>
        <select name="days" defaultValue={days} className="border rounded-md px-2 py-2 md:w-40">
          <option value="all">全期間</option>
          <option value="30">直近30日</option>
        </select>
        <button className="px-4 py-2 rounded-md text-white md:w-28" style={{ background:'#B67352' }}>検索</button>
      </form>
      {q && (
        <p className="text-sm text-gray-600">「{q}」の検索結果: {posts.length}件（最大{limit}件まで表示） / 並び: {sort==='popular'?'人気':'新着'} / 期間: {days==='30'?'30日':'全期間'}</p>
      )}
      <ul className="space-y-3">
        {posts.map((p:any)=> (
          <li key={p._id} className="border rounded-md p-4 bg-white">
            <Link href={`/${p.category}/${p.slug}`} className="text-lg font-semibold hover:underline">{p.title}</Link>
            <div className="text-xs text-gray-500 mt-1">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ja-JP') : ''} ・ カテゴリ: {p.categoryTitle || p.category}</div>
            {p.excerpt && <p className="text-sm text-gray-700 mt-2">{p.excerpt}</p>}
          </li>
        ))}
      </ul>
      {!q && <p className="text-sm text-gray-600">キーワードを入力して検索してください。</p>}
    </div>
  )
}
