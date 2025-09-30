import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { categories, recentPostsQuery } from '@/lib/queries'

export const metadata = { title: 'Sitemap', description: 'サイトマップ' }

export default async function SiteMapPage() {
  const recent = await sanityClient.fetch(recentPostsQuery, { limit: 50 }).catch(()=>[])
  return (
    <div className="container-responsive py-10 space-y-10">
      <section>
        <h1 className="text-2xl font-bold" style={{ color:'#B67352' }}>Sitemap</h1>
        <p className="text-gray-700 mt-2">主要ページと最新記事の一覧です。</p>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="card p-4">
          <h2 className="font-semibold" style={{ color:'#B67352' }}>サイト案内</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link className="underline" href="/about">自己紹介</Link></li>
            <li><Link className="underline" href="/contact">お問い合わせ</Link></li>
            <li><Link className="underline" href="/policy">プライバシーポリシー</Link></li>
            <li><Link className="underline" href="/terms">利用規約</Link></li>
            <li><Link className="underline" href="/disclaimer">免責事項</Link></li>
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold" style={{ color:'#B67352' }}>カテゴリ</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {categories.map(c => (
              <li key={c.slug}><Link className="underline" href={`/${c.slug}`}>{c.title}</Link></li>
            ))}
          </ul>
        </div>
        {/* 外部セクションは非表示にしました */}
      </section>

      <section className="card p-4">
        <h2 className="font-semibold mb-3" style={{ color:'#B67352' }}>最新記事</h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {recent.map((p:any)=> (
            <li key={p._id} className="border rounded-md p-3 bg-white">
              <Link href={`/${p.category}/${p.slug}`} className="hover:underline">{p.title}</Link>
              <div className="text-xs text-gray-500 mt-1">{new Date(p.publishedAt||Date.now()).toLocaleDateString('ja-JP')}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
