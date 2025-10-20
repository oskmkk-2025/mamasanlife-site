"use client"
import { useEffect, useMemo, useState } from 'react'
import { categories } from '@/lib/queries'

type Invalid = { _id: string; title: string; slug: string; category?: string; publishedAt?: string; updatedAt?: string }

export default function AuditCategoriesPage(){
  const [data, setData] = useState<{ dist: Record<string, number>; invalid: Invalid[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [selected, setSelected] = useState<string>(categories[0]?.slug || 'money')

  async function load(){
    setLoading(true); setMsg('')
    try{
      const res = await fetch('/api/admin/audit/categories', { headers:{ 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' } })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setData({ dist: j.dist, invalid: j.invalid })
    }catch(e:any){ setMsg('読み込みエラー: ' + (e?.message||'unknown')) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  async function fixOne(id: string){
    setMsg('')
    try{
      const res = await fetch('/api/admin/categorize', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ id, category: selected })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      await load()
    }catch(e:any){ setMsg('更新エラー: ' + (e?.message||'unknown')) }
  }

  return (
    <div className="container-responsive py-8">
      <h1 className="text-xl font-semibold mb-4">カテゴリ監査と修正</h1>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={load} className="border rounded px-3 py-1 text-sm">再読込</button>
        <label className="text-sm">修正先カテゴリ
          <select value={selected} onChange={e=>setSelected(e.target.value)} className="border px-2 py-1 rounded ml-2">
            {categories.map(c=> <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
        </label>
        {loading && <span className="text-xs text-amber-600">読み込み中...</span>}
        {msg && <span className="text-xs text-red-600">{msg}</span>}
      </div>

      {data && (
        <div className="space-y-6">
          <section className="card p-4">
            <h2 className="font-semibold mb-2">分布</h2>
            <ul className="text-sm grid sm:grid-cols-2 lg:grid-cols-3 gap-y-1">
              <li>総件数: {data.dist.total||0}</li>
              {categories.map(c=> <li key={c.slug}>{c.title}: {data.dist[c.slug]||0}</li>)}
              <li>不正（未設定/未知）: {data.dist.invalid||0}</li>
            </ul>
          </section>

          <section className="card p-4">
            <h2 className="font-semibold mb-2">未設定/未知カテゴリの記事（手動修正）</h2>
            {data.invalid.length === 0 ? (
              <p className="text-sm text-gray-500">対象なし</p>
            ) : (
              <ul className="divide-y">
                {data.invalid.map((p)=> (
                  <li key={p._id} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-gray-500">{p.slug}（現在: {p.category || '未設定'}）</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a className="border rounded px-2 py-1 text-xs" href={`/api/debug/post?slug=${encodeURIComponent(p.slug)}`} target="_blank">Debug</a>
                      <button onClick={()=>fixOne(p._id)} className="btn-brand text-xs">{categories.find(c=>c.slug===selected)?.title}へ設定</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )}

