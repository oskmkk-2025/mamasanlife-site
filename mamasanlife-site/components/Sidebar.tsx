import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { popularQuery, recentPostsQuery, tagCloudQuery, categories as CATS, tagsByCategoryFlatQuery } from '@/lib/queries'
import { ProfileCard } from './ProfileCard'

export async function Sidebar({ onlyCategory }: { onlyCategory?: string }) {
  const [popularRaw, recentRaw] = await Promise.all([
    sanityClient.fetch(popularQuery, { limit: 10 }).catch(() => []),
    sanityClient.fetch(recentPostsQuery, { limit: 10 }).catch(() => [])
  ])
  const { filterBlocked, uniquePostsBySlug } = await import('@/lib/post-utils')
  const allowed = new Set(CATS.map(c=>c.slug))
  let popular = uniquePostsBySlug(filterBlocked(popularRaw)).filter((p:any)=> allowed.has(p?.category))
  let recent = uniquePostsBySlug(filterBlocked(recentRaw)).filter((p:any)=> allowed.has(p?.category))
  if (onlyCategory){
    popular = popular.filter((p:any)=> p?.category === onlyCategory)
    recent = recent.filter((p:any)=> p?.category === onlyCategory)
  }
  popular = popular.slice(0,5)
  recent = recent.slice(0,5)
  // タグ: カテゴリページでは当該カテゴリのタグ頻出順、その他は全体のタグ
  let tagList: string[] = []
  if (onlyCategory) {
    const flat = await sanityClient.fetch(tagsByCategoryFlatQuery, { category: onlyCategory }).catch(()=>[] as any[])
    const freq = new Map<string, number>()
    for (const raw of flat||[]){
      const t = String(raw||'').trim()
      if (!t || t === '#') continue
      freq.set(t, (freq.get(t)||0)+1)
    }
    tagList = Array.from(freq.entries()).sort((a,b)=> (b[1]||0)-(a[1]||0)).map(([t])=>t).slice(0,30)
  } else {
    const tagsAll = await sanityClient.fetch(tagCloudQuery).catch(()=>[] as any[])
    tagList = (Array.isArray(tagsAll) ? tagsAll : [])
      .map((t:any)=> String(t||'').trim())
      .filter((t)=> t && t !== '#')
      .slice(0,50)
  }

  return (
    <aside className="space-y-6">
      <ProfileCard />
      <div className="card p-4">
        <div className="font-semibold mb-3 heading-accent">人気記事</div>
        <ul className="text-sm space-y-2">
          {popular?.map((p:any)=> {
            const href = p?.category ? `/${p.category}/${p.slug}` : `/${p.slug}`
            return (
              <li key={p._id}>
                <Link href={href}>{p.title}</Link>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="card p-4">
        <div className="font-semibold mb-3 heading-accent">新着記事</div>
        <ul className="text-sm space-y-2">
          {recent?.map((p:any)=> {
            const href = p?.category ? `/${p.category}/${p.slug}` : `/${p.slug}`
            return (
              <li key={p._id}>
                <Link href={href}>{p.title}</Link>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="card p-4">
        <div className="font-semibold mb-3 heading-accent">カテゴリー</div>
        <ul className="text-sm flex flex-wrap gap-2">
          {['money','parenting','life','work','health','feature'].map(c => (
            <li key={c}><Link href={`/${c}`} className="chip-accent">{c}</Link></li>
          ))}
        </ul>
      </div>
      {tagList.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-3 heading-accent">タグ</div>
          <div className="flex flex-wrap gap-2 text-xs">
            {tagList.map((t:string, i:number)=> (
              <Link key={i} href={`/search?${new URLSearchParams({ tag: t }).toString()}`} className="px-2 py-1 rounded-md bg-white border text-gray-700">#{t}</Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
