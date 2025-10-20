"use client"
import { useState } from 'react'

const DEFAULT_FILE = '../WordPress.2025-10-08.xml'

export default function AffiliateRestorePage(){
  const [file, setFile] = useState(DEFAULT_FILE)
  const [limit, setLimit] = useState(3)
  const [dryRun, setDryRun] = useState(true)
  const [nets, setNets] = useState({ amazon:true, rakuten:true, a8:true, moshimo:true, valuecommerce:true, yahoo:true })
  const [msg, setMsg] = useState('')
  const [res, setRes] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const run = async ()=>{
    setLoading(true); setMsg(''); setRes(null)
    try{
      const networks = Object.entries(nets).filter(([,v])=>v).map(([k])=>k)
      const r = await fetch('/api/admin/affiliate/restore', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ file, limitPerPost: limit, networks, dryRun })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'error')
      setRes(j)
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
    finally{ setLoading(false) }
  }

  return (
    <div className="container-responsive py-8 max-w-3xl">
      <h1 className="text-xl font-semibold mb-4">WXRからアフィリエイトリンクを復元</h1>
      <div className="grid gap-3">
        <label className="block text-sm">ファイルパス（リポジトリ相対）
          <input value={file} onChange={e=>setFile(e.target.value)} className="border w-full px-2 py-1 rounded font-mono"/>
        </label>
        <div className="text-sm">対象ネットワーク
          <div className="flex flex-wrap gap-3 mt-1">
            {Object.keys(nets).map(k=> (
              <label key={k} className="inline-flex items-center gap-1"><input type="checkbox" checked={(nets as any)[k]} onChange={(e)=> setNets(prev=> ({ ...prev, [k]: e.target.checked })) }/> {k}</label>
            ))}
          </div>
        </div>
        <label className="text-sm">1記事あたりの最大挿入数
          <input type="number" value={limit} onChange={e=>setLimit(Math.max(1, Math.min(parseInt(e.target.value||'3',10)||3, 10)))} className="border w-24 px-2 py-1 rounded ml-2"/>
        </label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={dryRun} onChange={e=>setDryRun(e.target.checked)} /> dryRun（試験実行・保存しない）</label>
        <button onClick={run} className="btn-brand" disabled={loading}>{loading? '実行中...' : '復元を実行'}</button>
        {msg && <p className="text-sm text-red-600">{msg}</p>}
        {res && (
          <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto">{JSON.stringify(res, null, 2)}</pre>
        )}
        <p className="text-xs text-gray-500 mt-2">注意: NEXT_PUBLIC_ADMIN_SECRET と SANITY_WRITE_TOKEN が必要です。対象はWXR内の a要素/バナーを検出し、記事末尾に htmlEmbed として挿入します（既存の同一リンクは重複挿入しません）。</p>
      </div>
    </div>
  )
}

