import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { searchPostsQuery } from '@/lib/queries'

export const revalidate = 60

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams
  const q = (sp?.q || '').trim()
  const limit = 30
  const posts = q
    ? await sanityClient.fetch(searchPostsQuery, { q: `${q}*`, limit }).catch(()=>[])
    : []
  return (
    <div className="container-responsive py-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color:'#B67352' }}>検索結果</h1>
      <form action="/search" method="get" className="flex items-center gap-2">
        <input name="q" defaultValue={q} placeholder="キーワードで検索" className="flex-1 border rounded-md px-3 py-2"/>
        <button className="px-4 py-2 rounded-md text-white" style={{ background:'#B67352' }}>検索</button>
      </form>
      {q && (
        <p className="text-sm text-gray-600">「{q}」の検索結果: {posts.length}件（最大{limit}件まで表示）</p>
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
