"use client"
import { useState } from 'react'

const DEFAULTS = `下のボタンからフォローしていただくと新しく記事が投稿された時に通知を受け取ることができます
「いいな」と思ったら気軽にフォローしてね`

export default function RemoveTextPage(){
  const [patterns, setPatterns] = useState(DEFAULTS)
  const [limit, setLimit] = useState(500)
  const [dryRun, setDryRun] = useState(true)
  const [msg, setMsg] = useState('')
  const [res, setRes] = useState<any>(null)
  const run = async ()=>{
    setMsg('実行中...'); setRes(null)
    try{
      const pats = patterns.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
      const r = await fetch('/api/admin/cleanup/remove-text', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ patterns: pats, limit, dryRun })
      })
      const j = await r.json(); if (!r.ok) throw new Error(j?.error || 'error')
      setRes(j); setMsg(`matched ${j.matched} / updated ${j.updated} (${dryRun? 'dryRun' : 'saved'})`)
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
  }
  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">本文から特定の文を削除（クリーンアップ）</h1>
      <p className="text-sm text-gray-600 mb-2">下のテキストに書かれた文と同じ文が記事本文にあれば、その段落を削除します（まずはdryRunで確認）。</p>
      <textarea value={patterns} onChange={e=>setPatterns(e.target.value)} rows={5} className="border w-full px-2 py-1 rounded font-mono"/>
      <div className="flex items-center gap-3 text-sm mt-2">
        <label>Limit <input type="number" value={limit} onChange={e=>setLimit(parseInt(e.target.value||'500',10))} className="border rounded px-2 py-1 w-24 ml-1"/></label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={dryRun} onChange={e=>setDryRun(e.target.checked)} /> dryRun（試しに実行・保存しない）</label>
        <button onClick={run} className="btn-brand">実行</button>
      </div>
      {msg && <p className="text-sm mt-3">{msg}</p>}
      {res && <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto mt-3">{JSON.stringify(res, null, 2)}</pre>}
      <p className="text-xs text-gray-500 mt-2">注意: NEXT_PUBLIC_ADMIN_SECRET と SANITY_WRITE_TOKEN を設定してください。文章は段落単位で削除します（一致部分を含む段落）。</p>
    </div>
  )
}

