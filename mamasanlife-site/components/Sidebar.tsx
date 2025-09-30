import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { popularQuery, recentPostsQuery, tagCloudQuery } from '@/lib/queries'
import { ProfileCard } from './ProfileCard'

export async function Sidebar() {
  const [popular, recent, tags] = await Promise.all([
    sanityClient.fetch(popularQuery, { limit: 5 }).catch(() => []),
    sanityClient.fetch(recentPostsQuery, { limit: 5 }).catch(() => []),
    sanityClient.fetch(tagCloudQuery).catch(() => [])
  ])
  return (
    <aside className="space-y-6">
      <ProfileCard />
      <div className="card p-4">
        <div className="font-semibold mb-3" style={{ color:'#B67352' }}>人気記事</div>
        <ul className="text-sm space-y-2">
          {popular?.map((p:any)=> (
            <li key={p._id}>
              <Link href={`/${p.category}/${p.slug}`} className="hover:underline">{p.title}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-4">
        <div className="font-semibold mb-3" style={{ color:'#B67352' }}>新着記事</div>
        <ul className="text-sm space-y-2">
          {recent?.map((p:any)=> (
            <li key={p._id}>
              <Link href={`/${p.category}/${p.slug}`} className="hover:underline">{p.title}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="card p-4">
        <div className="font-semibold mb-3" style={{ color:'#B67352' }}>カテゴリー</div>
        <ul className="text-sm flex flex-wrap gap-2">
          {['money','parenting','life','work','health','feature'].map(c => (
            <li key={c}><Link href={`/${c}`} className="chip-accent">{c}</Link></li>
          ))}
        </ul>
      </div>
      {tags?.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-3" style={{ color:'#B67352' }}>タグ</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {tags.map((t:string, i:number)=> (
              <Link key={i} href={`/search?tag=${encodeURIComponent(t)}`} className="px-2 py-1 rounded-md bg-white border text-gray-700">#{t}</Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
