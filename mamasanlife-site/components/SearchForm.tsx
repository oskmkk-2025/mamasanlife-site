"use client"
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function SearchForm({ className }: { className?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const pathname = usePathname()
  const [q, setQ] = useState(params.get('q') || '')
  useEffect(()=>{ setQ(params.get('q') || '') },[params])
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const target = '/search?q=' + encodeURIComponent(q.trim())
    router.push(target)
  }
  return (
    <form onSubmit={submit} className={className} role="search" aria-label="サイト内検索">
      <div className="flex items-center gap-2 bg-white rounded-md px-2 py-1 border" style={{borderColor:'#7fb0b4'}}>
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="キーワードで検索"
          className="flex-1 outline-none text-sm"
          aria-label="検索ワード"
        />
        <button type="submit" className="text-sm px-3 py-1 rounded-md" style={{background:'#B67352', color:'#fff'}}>検索</button>
      </div>
    </form>
  )
}

