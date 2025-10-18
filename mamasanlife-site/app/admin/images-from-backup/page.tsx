"use client"
import { useState } from 'react'

export default function ImagesFromBackupAdmin(){
  const [slug, setSlug] = useState('smartphone-for-junior-high-school-students')
  const [msg, setMsg] = useState('')
  const run = async () => {
    setMsg('実行中...')
    try{
      const res = await fetch('/api/admin/images/from-backup', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || '' },
        body: JSON.stringify({ slug })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setMsg(`完了: 画像アップロード ${j.uploaded} 件 / 挿入 ${j.inserted} 件（ページ更新で確認）`)
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
  }
  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">記事内画像の復元（WXRバックアップから）</h1>
      <label className="block text-sm mb-3">Slug
        <input value={slug} onChange={e=>setSlug(e.target.value)} className="border w-full px-2 py-1 rounded"/>
      </label>
      <button onClick={run} className="btn-brand">復元を実行</button>
      {msg && <p className="text-sm text-gray-600 mt-3">{msg}</p>}
      <p className="text-xs text-gray-500 mt-4">注意: 環境変数 NEXT_PUBLIC_ADMIN_SECRET と SANITY_WRITE_TOKEN が必要です。WXRと画像のバックアップはリポジトリ直下/backupsを参照します。</p>
    </div>
  )
}

