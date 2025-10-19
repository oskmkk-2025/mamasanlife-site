"use client"
import { useMemo, useState, useTransition } from 'react'

type Cat = { slug: string; title: string }
type Post = {
  _id: string
  slug: string
  title: string
  category?: string
  categoryTitle?: string
  publishedAt?: string
  updatedAt?: string
}

export function AdminCategorizeClient({ posts, categories }: { posts: Post[]; categories: Cat[] }){
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all'|'uncategorized'|'cat'>('all')
  const [catFilter, setCatFilter] = useState<string>('money')
  const [pendingIds, setPending] = useState<Set<string>>(new Set())
  const [doneIds, setDone] = useState<Set<string>>(new Set())
  const [local, setLocal] = useState<Map<string,string>>(new Map())
  const [msg, setMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  const counts = useMemo(()=>{
    const map: Record<string, number> = { all: posts.length, uncategorized: 0 }
    for (const c of categories) map[c.slug] = 0
    for (const p of posts){
      if (!p.category) map.uncategorized++
      const cat = local.get(p._id) || p.category
      if (cat) map[cat] = (map[cat]||0)+1
    }
    return map
  },[posts, categories, local])

  const filtered = useMemo(()=>{
    const norm = (s:string)=> (s||'').toLowerCase()
    const qq = norm(q)
    return posts.filter(p=>{
      const catNow = local.get(p._id) || p.category || ''
      if (filter==='uncategorized' && catNow) return false
      if (filter==='cat' && catNow !== catFilter) return false
      if (qq && !(norm(p.title).includes(qq) || norm(p.slug).includes(qq))) return false
      return true
    })
  },[posts, q, filter, catFilter, local])

  async function setCategory(id: string, category: string){
    setPending(new Set(p=>p).add(id))
    setMsg('')
    try{
      const res = await fetch('/api/admin/categorize', {
        method:'POST',
        headers: { 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ id, category })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setLocal(prev => new Map(prev).set(id, category))
      setDone(prev => new Set(prev).add(id))
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
    finally{
      setPending(prev=>{ const n = new Set(prev); n.delete(id); return n })
    }
  }

  function resetLocal(){ setLocal(new Map()); setDone(new Set()); setMsg('ローカル表示をリセットしました（保存済みの変更は保持）') }

  return (
    <div className="container-responsive py-8">
      <h1 className="text-xl font-semibold mb-4">カテゴリ振り分けツール</h1>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-4">
        <label className="text-sm">キーワード
          <input value={q} onChange={e=>setQ(e.target.value)} className="border w-full sm:w-72 px-2 py-1 rounded ml-2" placeholder="タイトル・スラッグ検索"/>
        </label>
        <label className="text-sm">表示
          <select value={filter} onChange={e=>setFilter(e.target.value as any)} className="border px-2 py-1 rounded ml-2">
            <option value="all">すべて（{counts.all}）</option>
            <option value="uncategorized">未設定（{counts.uncategorized}）</option>
            <option value="cat">カテゴリ別</option>
          </select>
        </label>
        {filter==='cat' && (
          <label className="text-sm">カテゴリ
            <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="border px-2 py-1 rounded ml-2">
              {categories.map(c=> <option key={c.slug} value={c.slug}>{c.title}（{counts[c.slug]||0}）</option>)}
            </select>
          </label>
        )}
        <button onClick={resetLocal} className="border rounded px-3 py-1 text-sm">ローカル表示をリセット</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((c)=> (
          <span key={c.slug} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-white">
            {c.title}
          </span>
        ))}
      </div>

      {msg && <p className="text-sm text-red-600 mb-2">{msg}</p>}

      <ul className="divide-y bg-white border rounded">
        {filtered.map((p)=>{
          const catNow = local.get(p._id) || p.category || ''
          const isPending = pendingIds.has(p._id)
          const isDone = doneIds.has(p._id)
          return (
            <li key={p._id} className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">{p.slug}</span>
                <span className="text-xs text-gray-500">({new Date(p.publishedAt||p.updatedAt||Date.now()).toLocaleDateString('ja-JP')})</span>
              </div>
              <div className="font-medium">{p.title}</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs inline-flex items-center gap-1 rounded-full px-2 py-1 border bg-gray-50">
                  現在: <b>{categories.find(c=>c.slug===catNow)?.title || (catNow || '未設定')}</b>
                </span>
                <div className="flex flex-wrap gap-1">
                  {categories.map((c)=> (
                    <button
                      key={c.slug}
                      disabled={isPending}
                      onClick={()=> setCategory(p._id, c.slug)}
                      className={`px-2 py-1 rounded border text-xs focus-ring ${catNow===c.slug ? 'bg-emphasis text-white border-emphasis' : 'bg-white hover:bg-gray-50'}`}
                    >{c.title}</button>
                  ))}
                </div>
                {isPending && <span className="text-xs text-amber-600">更新中...</span>}
                {isDone && <span className="text-xs text-emerald-700">保存済み</span>}
              </div>
            </li>
          )
        })}
      </ul>
      {filtered.length===0 && (
        <p className="text-sm text-gray-500">該当する記事がありません。</p>
      )}
    </div>
  )
}
