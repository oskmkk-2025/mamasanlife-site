"use client"
import { useState } from 'react'

export default function ImportTagsFromWxrPage(){
  const [file, setFile] = useState('../WordPress.2025-10-08.xml')
  const [mode, setMode] = useState<'replace'|'merge'>('replace')
  const [msg, setMsg] = useState('')
  const [res, setRes] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(true)

  const run = async ()=>{
    setLoading(true); setMsg(''); setRes(null)
    try{
      const r = await fetch('/api/admin/tags/import-from-wxr', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ file, mode, report })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'error')
      setRes(j)
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
    finally{ setLoading(false) }
  }

  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">WXRからタグを再取り込み</h1>
      <div className="space-y-3">
        <label className="block text-sm">ファイルパス（リポジトリ相対）
          <input value={file} onChange={e=>setFile(e.target.value)} className="border w-full px-2 py-1 rounded font-mono"/>
        </label>
        <label className="block text-sm">モード
          <select value={mode} onChange={e=>setMode(e.target.value as any)} className="border px-2 py-1 rounded ml-2">
            <option value="replace">置換（WXRのタグで上書き）</option>
            <option value="merge">マージ（既存と統合）</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={report} onChange={e=>setReport(e.target.checked)} /> 詳細レポート（changed/noChange/notFound）
        </label>
        <button onClick={run} className="btn-brand" disabled={loading}>{loading? '実行中...' : '取り込みを実行'}</button>
        {msg && <p className="text-sm text-red-600">{msg}</p>}
        {res && (
          <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto">{JSON.stringify(res, null, 2)}</pre>
        )}
        <p className="text-xs text-gray-500">注意: NEXT_PUBLIC_ADMIN_SECRET と SANITY_WRITE_TOKEN が必要です。WXRは WordPress のエクスポート（XML）を指定します。</p>
      </div>
    </div>
  )
}
