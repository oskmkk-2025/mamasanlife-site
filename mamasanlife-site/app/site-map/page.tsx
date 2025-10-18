import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.client'
import { allPostSlugsQuery, categories as CATS } from '@/lib/queries'

export const revalidate = 300

export default async function SiteMapPage({ searchParams }: { searchParams: Promise<{ ym?: string }> }){
  const sp = await searchParams
  const ym = (sp?.ym || '').match(/^\d{4}-\d{2}$/) ? sp.ym : ''
  let posts = await sanityClient.fetch(allPostSlugsQuery).catch(()=>[] as any[])
  // タイトルキーワードでの一時的な非表示フィルタ（将来的には Sanity 側の hidden フラグ運用が望ましい）
  const BLOCKED = ['貼付用']
  posts = (posts || []).filter((p:any)=> !BLOCKED.some(k => (p?.title||'').includes(k)))
  // グローバル重複除去（category/slug 単位）
  const seenGlobal = new Set<string>()
  const postsUniq: any[] = []
  for (const p of posts||[]) {
    const key = `${p?.category || ''}/${p?.slug}`
    if (!p?.slug) continue
    if (seenGlobal.has(key)) continue
    seenGlobal.add(key)
    postsUniq.push(p)
  }
  posts = postsUniq

  // ツリー用: 年→月→記事
  const byYear = new Map<string, any[]>()
  for (const p of posts||[]) {
    const d = p?.publishedAt ? new Date(p.publishedAt) : null
    const y = d ? String(d.getFullYear()) : '不明'
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(p)
  }
  const years = Array.from(byYear.keys()).sort().reverse()

  // 総件数（ユニーク：category/slug）
  const seenAll = new Set<string>()
  for (const p of posts||[]) {
    const key = `${p?.category || ''}/${p?.slug}`
    seenAll.add(key)
  }
  const totalUnique = seenAll.size

  // カテゴリ名の補助
  const catTitle = (slug:string) => (CATS.find(c=>c.slug===slug)?.title) || 'その他'
  const catOrder = (slug:string) => {
    const i = CATS.findIndex(c=>c.slug===slug)
    return i === -1 ? 999 : i
  }

  return (
    <main className="container-responsive py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-emphasis">サイトマップ</h1>
      <section className="mt-6">
        <h2 className="text-xl font-semibold">固定ページ</h2>
        <ul className="list-disc pl-6 mt-2">
          <li><Link href="/about" className="link-brand">このサイトについて</Link></li>
          <li><Link href="/contact" className="link-brand">お問い合わせ</Link></li>
          <li><Link href="/policy" className="link-brand">プライバシーポリシー</Link></li>
          <li><Link href="/terms" className="link-brand">利用規約</Link></li>
          <li><Link href="/disclaimer" className="link-brand">免責事項</Link></li>
        </ul>
      </section>

      {/* ツリー表示（年→月→カテゴリ→記事） */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">記事（{totalUnique}件）</h2>
        <div className="mt-3 space-y-3">
          {years.map(y => {
            const psYearRaw = byYear.get(y) || []
            // 年内の重複除去（category/slug）
            const seenYear = new Set<string>()
            const psYear: any[] = []
            for (const p of psYearRaw) {
              const key = `${p?.category || ''}/${p?.slug}`
              if (seenYear.has(key)) continue; seenYear.add(key); psYear.push(p)
            }
            // 月ごとにまとめる（年内ユニーク後）
            const byMonth: Record<string, any[]> = {}
            for (const p of psYear) {
              const d = p?.publishedAt ? new Date(p.publishedAt) : null
              const m = d ? String(d.getMonth()+1).padStart(2,'0') : '不明'
              ;(byMonth[m] = byMonth[m] || []).push(p)
            }
            const months = Object.keys(byMonth).filter(m=>m!=='不明').sort((a,b)=> Number(b)-Number(a))
            return (
              <details key={y} className="bg-white border rounded-md p-3">
                <summary className="cursor-pointer font-semibold text-emphasis">{y}年（{psYear.length}件）</summary>
                <div className="mt-2 space-y-3">
                  {months.map(m => {
                    const psMonthAll = (byMonth[m] || []) as any[]
                    // 重複除去（slug+category をキーに）
                    const seen = new Set<string>()
                    const psMonth: any[] = []
                    for (const p of psMonthAll) {
                      const key = `${p?.category || ''}/${p?.slug}`
                      if (seen.has(key)) continue
                      seen.add(key); psMonth.push(p)
                    }
                    // 新着順に並び替え（publishedAt 降順）
                    psMonth.sort((a:any,b:any)=>{
                      const da = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0
                      const db = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0
                      return db - da
                    })
                    return (
                      <details key={`${y}-${m}`} className="bg-white border rounded-md p-3">
                        <summary className="cursor-pointer">{m}月（{psMonth.length}件）</summary>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                          {psMonth.map((p:any)=> {
                            const href = p?.category ? `/${p.category}/${p.slug}` : `/${p.slug}`
                            const d = p?.publishedAt ? new Date(p.publishedAt) : null
                            const prefix = d ? `${d.getMonth()+1}/${d.getDate()} ＞ ` : ''
                            return (
                            <li key={`${y}-${m}-${p?.category || 'other'}-${p.slug}`}>
                  <Link href={href} className="link-brand">{prefix}{p.title}</Link>
                            </li>
                          )})}
                        </ul>
                      </details>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
      </section>
    </main>
  )
}
