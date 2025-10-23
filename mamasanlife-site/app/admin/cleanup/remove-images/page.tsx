"use client"
import { useState } from 'react'

export default function RemoveImagesPage(){
  const [slug, setSlug] = useState('')
  const [dry, setDry] = useState(true)
  const [msg, setMsg] = useState('')
  const [res, setRes] = useState<any>(null)
  const run = async ()=>{
    if (!slug.trim()){ setMsg('slug を入れてください'); return }
    setMsg('実行中...'); setRes(null)
    try{
      const r = await fetch('/api/admin/cleanup/remove-images', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ slug: slug.trim(), dryRun: dry })
      })
      const j = await r.json(); if (!r.ok) throw new Error(j?.error || 'error')
      setRes(j); setMsg(`removed: ${j.removed}（${dry? 'dryRun' : '保存済み'}）`)
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
  }
  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">本文の画像を一括削除（ヒーローはそのまま）</h1>
      <label className="block text-sm mb-3">Slug
        <input value={slug} onChange={e=>setSlug(e.target.value)} className="border w-full px-2 py-1 rounded font-mono" placeholder="example-slug"/>
      </label>
      <div className="flex items-center gap-3">
        <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={dry} onChange={e=>setDry(e.target.checked)} /> dryRun（試しに実行・保存しない）</label>
        <button onClick={run} className="btn-brand">実行</button>
        <a href={`/preview/${slug || ''}`} target="_blank" rel="noopener" className="border rounded px-3 py-2 text-sm">プレビューを開く</a>
      </div>
      {msg && <p className="text-sm mt-3">{msg}</p>}
      {res && <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto mt-3">{JSON.stringify(res, null, 2)}</pre>}
      <p className="text-xs text-gray-500 mt-2">注意: 画像ブロック（_type=image）のみ削除します。ヒーロー画像は本文とは別フィールドなので消えません。</p>
    </div>
  )
}

