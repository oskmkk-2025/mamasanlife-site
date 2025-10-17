"use client"
import { useState } from 'react'

export default function HeroAdmin(){
  const [slug, setSlug] = useState('smartphone-for-junior-high-school-students')
  const [imageUrl, setImageUrl] = useState('https://mamasanmoney-bu.com/wp-content/uploads/2025/01/mono2.jpg')
  const [alt, setAlt] = useState('')
  const [msg, setMsg] = useState('')
  const run = async () => {
    setMsg('実行中...')
    try{
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || ''
        },
        body: JSON.stringify({ slug, imageUrl, alt })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'error')
      setMsg('完了しました（ページを更新してご確認ください）')
    }catch(e:any){ setMsg('エラー: ' + (e?.message||'unknown')) }
  }
  return (
    <div className="container-responsive py-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Hero 画像設定（WordPressのアイキャッチを反映）</h1>
      <div className="space-y-3">
        <label className="block text-sm">Slug
          <input value={slug} onChange={e=>setSlug(e.target.value)} className="border w-full px-2 py-1 rounded"/>
        </label>
        <label className="block text-sm">画像URL（WordPressのアイキャッチURL）
          <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="border w-full px-2 py-1 rounded font-mono"/>
        </label>
        <label className="block text-sm">alt（省略時は記事タイトル）
          <input value={alt} onChange={e=>setAlt(e.target.value)} className="border w-full px-2 py-1 rounded"/>
        </label>
        <button onClick={run} className="btn-brand">設定を実行</button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
        <p className="text-xs text-gray-500">注意: 環境変数 NEXT_PUBLIC_ADMIN_SECRET と SANITY_WRITE_TOKEN を設定してください。</p>
      </div>
    </div>
  )
}

