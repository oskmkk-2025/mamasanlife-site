"use client"
import { useState } from 'react'

export default function AppreachAdmin(){
  const [slug, setSlug] = useState('smartphone-for-junior-high-school-students')
  const [html, setHtml] = useState('')
  const [msg, setMsg] = useState('')
  const [beforeText, setBeforeText] = useState('')
  const [removeExisting, setRemoveExisting] = useState(true)
  const [strict, setStrict] = useState(false)
  const [searchWindow, setSearchWindow] = useState(20)
  const [deleteOnly, setDeleteOnly] = useState(false)
  const [anchor, setAnchor] = useState<'before'|'after'|'replace'>('before')
  const run = async () => {
    setMsg('実行中...')
    try{
      const res = await fetch('/api/admin/appreach', {
        method:'POST',
        headers: {
          'Content-Type':'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || ''
        },
        body: JSON.stringify({ slug, html, beforeText, removeExisting, strict, searchWindow, deleteOnly, anchor })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setMsg('完了しました（ページを更新してご確認ください）')
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
  }
  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Appreach 挿入（先頭画像と置換）</h1>
      <div className="space-y-3">
        <label className="block text-sm">Slug
          <input value={slug} onChange={e=>setSlug(e.target.value)} className="border w-full px-2 py-1 rounded"/>
        </label>
        <label className="block text-sm">HTML（アプリーチのコード）
          <textarea value={html} onChange={e=>setHtml(e.target.value)} rows={8} className="border w-full px-2 py-1 rounded font-mono"/>
        </label>
        <label className="block text-sm">このテキストの直前の画像と置換（任意）
          <input value={beforeText} onChange={e=>setBeforeText(e.target.value)} placeholder="例: ファミリー共有を利用して管理者が…" className="border w-full px-2 py-1 rounded"/>
        </label>
        <fieldset className="block text-sm">
          <legend className="mb-1">挿入位置（目印テキストに対して）</legend>
          <label className="mr-4"><input type="radio" name="anchor" checked={anchor==='before'} onChange={()=>setAnchor('before')} className="mr-1"/>前に挿入</label>
          <label className="mr-4"><input type="radio" name="anchor" checked={anchor==='after'} onChange={()=>setAnchor('after')} className="mr-1"/>後ろに挿入</label>
          <label><input type="radio" name="anchor" checked={anchor==='replace'} onChange={()=>setAnchor('replace')} className="mr-1"/>段落を置換</label>
          <p className="text-xs text-gray-500 mt-1">※ 近傍に画像があればそちらの置換を優先。見つからない場合、厳密モードOFFで上記位置に挿入します。</p>
        </fieldset>
        <label className="block text-sm"><input type="checkbox" checked={removeExisting} onChange={e=>setRemoveExisting(e.target.checked)} className="mr-2"/>既存のアプリーチを全て削除してから実行</label>
        <label className="block text-sm"><input type="checkbox" checked={strict} onChange={e=>setStrict(e.target.checked)} className="mr-2"/>厳密モード（見つからなければ挿入しない）</label>
        <label className="block text-sm">検索範囲（直前に遡るブロック数、既定20）
          <input type="number" value={searchWindow} onChange={e=>setSearchWindow(parseInt(e.target.value||'20',10))} className="border w-24 px-2 py-1 rounded ml-2"/>
        </label>
        <label className="block text-sm"><input type="checkbox" checked={deleteOnly} onChange={e=>setDeleteOnly(e.target.checked)} className="mr-2"/>削除のみ（置換しない）</label>
        <button onClick={run} className="btn-brand">置換を実行</button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
        <p className="text-xs text-gray-500">注意: 環境変数 NEXT_PUBLIC_ADMIN_SECRET と SANITY_WRITE_TOKEN を設定してください。</p>
      </div>
    </div>
  )
}
