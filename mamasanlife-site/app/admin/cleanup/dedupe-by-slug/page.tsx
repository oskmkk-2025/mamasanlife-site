"use client"
import { useEffect, useState } from 'react'

type Item = { id: string; category?: string; title?: string; blocks?: number }
type Group = { slug: string; keep: Item; remove: Item[] }

export default function DedupeBySlugPage(){
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [limit, setLimit] = useState(1000)
  const [dryRun, setDryRun] = useState(true)

  async function load(){
    setLoading(true); setMsg('')
    try{
      const res = await fetch('/api/admin/cleanup/dedupe-by-slug', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ mode: 'report', limit })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setGroups((j.results||[]) as Group[])
      setMsg(`${j.groups||0} グループ検出`)
    }catch(e:any){ setMsg('読み込みエラー: ' + (e?.message||'unknown')) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  async function apply(){
    if (!groups.length){ setMsg('重複がありません'); return }
    setLoading(true); setMsg('')
    try{
      const res = await fetch('/api/admin/cleanup/dedupe-by-slug', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ mode: 'delete', limit, dryRun })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setMsg(`削除: ${j.removed||0}（dryRun=${String(j.dryRun)}）`)
      await load()
    }catch(e:any){ setMsg('実行エラー: ' + (e?.message||'unknown')) }
    finally{ setLoading(false) }
  }

  return (
    <div className="container-responsive py-8">
      <h1 className="text-xl font-semibold mb-4">重複スラッグの整理（カテゴリ跨り）</h1>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-sm">limit
          <input type="number" value={limit} onChange={e=>setLimit(Number(e.target.value)||1000)} className="border rounded px-2 py-1 ml-2 w-24"/>
        </label>
        <label className="text-sm inline-flex items-center gap-1">
          <input type="checkbox" checked={dryRun} onChange={e=>setDryRun(e.target.checked)} /> dryRun
        </label>
        <button onClick={load} className="border rounded px-3 py-1 text-sm">再読込</button>
        <button onClick={apply} className="btn-brand text-sm" disabled={loading}>推奨ルールで整理（削除）</button>
        {loading && <span className="text-xs text-amber-600">処理中...</span>}
        {msg && <span className="text-xs text-gray-700">{msg}</span>}
      </div>

      {groups.length===0 ? (
        <p className="text-sm text-gray-500">重複は検出されていません。</p>
      ) : (
        <ul className="divide-y">
          {groups.map(g=> (
            <li key={g.slug} className="py-3">
              <div className="font-mono text-sm">{g.slug}</div>
              <div className="text-xs text-gray-600">keep: {g.keep?.id} ({g.keep?.category}) — remove: {g.remove.map(r=>r.id).join(', ')}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

