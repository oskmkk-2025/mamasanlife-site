"use client"
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { SearchForm } from './SearchForm'
const cats = [
  { href: '/money', label: 'お金・家計管理' },
  { href: '/parenting', label: '子育て・教育' },
  { href: '/life', label: '暮らし・家事' },
  { href: '/work', label: '働き方・キャリア' },
  { href: '/health', label: '心と健康' },
  { href: '/feature', label: '特集' },
]

export function HeaderBar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="border-b" style={{ background: '#8CB9BD' }}>
      <div className="container-responsive h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg text-white">Mamasan Life</Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-white/90">
          <Link href="/about" className="hover:underline">自己紹介</Link>
          <Link href="/site-map" className="hover:underline">サイトマップ</Link>
          <Link href="/contact" className="hover:underline">お問い合わせ</Link>
        </nav>
        <div className="hidden md:block min-w-[260px] w-72">
          <Suspense fallback={<div className="h-9"/>}>
            <SearchForm />
          </Suspense>
        </div>
        <button className="md:hidden text-white" aria-label="open menu" onClick={()=>setOpen(v=>!v)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t" style={{ borderColor:'#7fb0b4', background:'#8CB9BD' }}>
          <div className="container-responsive py-3 text-white/90 text-sm flex flex-col gap-3">
            <Suspense fallback={null}>
              <SearchForm />
            </Suspense>
            <Link href="/about" onClick={()=>setOpen(false)} className="underline">自己紹介</Link>
            <Link href="/site-map" onClick={()=>setOpen(false)} className="underline">サイトマップ</Link>
            <Link href="/contact" onClick={()=>setOpen(false)} className="underline">お問い合わせ</Link>
            <div className="opacity-80">— Categories —</div>
            {cats.map(c=> (
              <Link key={c.href} href={c.href} onClick={()=>setOpen(false)} className="pl-1">{c.label}</Link>
            ))}
          </div>
        </div>
      )}
      {/* 下段ナビは別コンポーネント（CategoryCarousel）で表現 */}
    </header>
  )
}
