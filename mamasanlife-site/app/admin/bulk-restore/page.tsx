"use client"
import { useState } from 'react'

export default function BulkRestore(){
  const [slugsText, setSlugsText] = useState('')
  const [limit, setLimit] = useState(50)
  const [includeHero, setIncludeHero] = useState(true)
  const [includeImages, setIncludeImages] = useState(true)
  const [msg, setMsg] = useState('')
  const run = async ()=>{
    setMsg('実行中...')
    try{
      const slugs = slugsText.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
      const res = await fetch('/api/admin/bulk-restore', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ slugs, limit, includeHero, includeImages })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setMsg(`完了: 処理 ${j.processed} 件 / ok ${j.okCount} / fail ${j.failCount}`)
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
  }
  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">一括復元（Hero + 本文画像）</h1>
      <p className="text-sm text-gray-600 mb-3">slugを1行ずつ貼り付け（空なら最新から上位{limit}件を処理）</p>
      <textarea value={slugsText} onChange={e=>setSlugsText(e.target.value)} rows={6} className="border w-full px-2 py-1 rounded font-mono" placeholder={"example-1\nexample-2"} />
      <div className="flex items-center gap-4 my-3 text-sm">
        <label><input type="checkbox" checked={includeHero} onChange={e=>setIncludeHero(e.target.checked)} className="mr-2"/>Hero画像</label>
        <label><input type="checkbox" checked={includeImages} onChange={e=>setIncludeImages(e.target.checked)} className="mr-2"/>本文画像</label>
        <label>Limit <input type="number" value={limit} onChange={e=>setLimit(parseInt(e.target.value||'50',10))} className="border px-2 py-1 rounded w-20 ml-2"/></label>
      </div>
      <button onClick={run} className="btn-brand">一括実行</button>
      {msg && <p className="text-sm text-gray-600 mt-3">{msg}</p>}
      <p className="text-xs text-gray-500 mt-4">注意: NEXT_PUBLIC_ADMIN_SECRET と SANITY_WRITE_TOKEN を設定してください。WXR/画像はリポジトリ直下/backups配下を参照します。</p>
    </div>
  )
}

