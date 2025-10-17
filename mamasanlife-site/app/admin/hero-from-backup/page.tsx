"use client"
import { useState } from 'react'

export default function HeroFromBackupAdmin(){
  const [slug, setSlug] = useState('smartphone-for-junior-high-school-students')
  const [alt, setAlt] = useState('')
  const [msg, setMsg] = useState('')
  const run = async () => {
    setMsg('実行中...')
    try{
      const res = await fetch('/api/admin/hero/from-backup', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || ''
        },
        body: JSON.stringify({ slug, alt })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setMsg(`完了しました（WP: ${j.wpUrl} → ローカル: ${j.local}）`)
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
  }
  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Hero 画像設定（バックアップから復元）</h1>
      <div className="space-y-3">
        <label className="block text-sm">Slug
          <input value={slug} onChange={e=>setSlug(e.target.value)} className="border w-full px-2 py-1 rounded"/>
        </label>
        <label className="block text-sm">alt（省略時はWPタイトル or 記事タイトル）
          <input value={alt} onChange={e=>setAlt(e.target.value)} className="border w-full px-2 py-1 rounded"/>
        </label>
        <button onClick={run} className="btn-brand">バックアップから設定</button>
        {msg && <p className="text-sm text-gray-600 break-all">{msg}</p>}
        <p className="text-xs text-gray-500">注意: 環境変数 NEXT_PUBLIC_ADMIN_SECRET と SANITY_WRITE_TOKEN が必要です。WXR/画像はリポジトリ直下・backups配下を参照します。</p>
      </div>
    </div>
  )
}

