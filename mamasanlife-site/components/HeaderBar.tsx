"use client"
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { SearchForm } from './SearchForm'
import { LineFollowButton } from './LineFollowButton'
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
    <header className="border-b bg-primary sticky top-0 z-50">
      <div className="container-responsive flex flex-wrap items-center justify-between gap-3 py-2 md:py-0 md:h-16">
        <div className="flex items-center">
          <a href="/" className="focus-ring flex items-center gap-2" aria-label="Mamasan Life トップへ" title="Mamasan Life">
            <img
              src="/icons/site-logo.png"
              alt="Mamasan Life"
              className="h-16 w-auto hidden md:block"
            />
            <img
              src="/icons/site-logo.png"
              alt="Mamasan Life"
              className="h-14 w-auto md:hidden"
            />
          </a>
        </div>
        <nav className="hidden md:flex items-center gap-5 text-sm text-white/90" aria-label="ユーティリティナビゲーション">
          <Link href="/about" className="rounded-md px-2 py-1 focus-ring">自己紹介</Link>
          <Link href="/site-map" className="rounded-md px-2 py-1 focus-ring">サイトマップ</Link>
          <Link href="/contact" className="rounded-md px-2 py-1 focus-ring">お問い合わせ</Link>
        </nav>
        <div className="hidden md:block min-w-[260px] w-72">
          <Suspense fallback={<div className="h-9"/>}>
            <SearchForm />
          </Suspense>
        </div>
        {process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL && (
          <div className="hidden md:flex flex-col items-center gap-1">
            <span className="w-full text-center text-[11px] text-white font-bold leading-none caption-soft">ブログの更新をお知らせ(無料)</span>
            <LineFollowButton href={process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL} label="LINEで友だちになる" size="sm" variant="outlineWhite" />
          </div>
        )}
        {process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL && (
          <div className="md:hidden flex w-full flex-col items-center gap-1">
            <span className="w-full text-center text-[11px] text-white font-bold leading-tight caption-soft">ブログの更新をお知らせ(無料)</span>
            <LineFollowButton
              href={process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL}
              label="LINEで友だちになる"
              size="sm"
              variant="outlineWhite"
              className="w-full justify-center max-w-[220px]"
            />
          </div>
        )}
        <button
          className="md:hidden text-white rounded-md focus-ring"
          aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
          aria-controls="mobileMenu"
          aria-expanded={open}
          onClick={()=>setOpen(v=>!v)}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
      {open && (
        <div id="mobileMenu" className="md:hidden border-t bg-primary border-primary">
          <div className="container-responsive py-3 text-white/90 text-sm flex flex-col gap-3" role="navigation" aria-label="モバイルメニュー">
            <Suspense fallback={null}>
              <SearchForm />
            </Suspense>
            <ul className="flex flex-col gap-2">
              <li><Link href="/about" onClick={()=>setOpen(false)} className="rounded-md px-2 py-1 focus-ring">自己紹介</Link></li>
              <li><Link href="/site-map" onClick={()=>setOpen(false)} className="rounded-md px-2 py-1 focus-ring">サイトマップ</Link></li>
              <li><Link href="/contact" onClick={()=>setOpen(false)} className="rounded-md px-2 py-1 focus-ring">お問い合わせ</Link></li>
            </ul>
            <div className="opacity-80 mt-1">— Categories —</div>
            <ul className="flex flex-col gap-1">
              {cats.map(c=> (
                <li key={c.href}><Link href={c.href} onClick={()=>setOpen(false)} className="pl-1 rounded-md px-1 py-1 focus-ring">{c.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* 下段ナビは別コンポーネント（CategoryCarousel）で表現 */}
    </header>
  )
}
