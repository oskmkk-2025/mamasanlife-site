"use client"
import { useState } from 'react'

export default function PublishAdmin(){
  const [slug, setSlug] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (action: 'publish'|'draft') => {
    if (!slug.trim()) { setMsg('slug を入れてください'); return }
    setBusy(true); setMsg('実行中...')
    try{
      const res = await fetch('/api/admin/publish', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ slug: slug.trim(), action })
      })
      const j = await res.json(); if (!res.ok) throw new Error(j?.error || 'error')
      setMsg(`OK: ${j.slug} → ${j.status}${j.setPublishedAt ? '（publishedAt を現在に設定）' : ''}`)
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
    finally{ setBusy(false) }
  }

  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">公開/下書き 切替（slug 指定）</h1>
      <div className="space-y-3">
        <label className="block text-sm">slug
          <input value={slug} onChange={e=>setSlug(e.target.value)} className="border w-full px-2 py-1 rounded font-mono" placeholder="example-slug" />
        </label>
        <div className="flex items-center gap-3">
          <button onClick={()=>run('publish')} disabled={busy} className="btn-brand">公開（Published）</button>
          <button onClick={()=>run('draft')} disabled={busy} className="border rounded px-3 py-2">下書きに戻す</button>
        </div>
        {msg && <p className="text-sm mt-2">{msg}</p>}
        <p className="text-xs text-gray-500">Published の記事だけがサイトに表示されます。公開すると publishedAt が空なら「今」に自動設定します。</p>
      </div>
    </div>
  )
}

