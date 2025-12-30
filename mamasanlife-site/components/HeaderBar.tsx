"use client"
import Link from 'next/link'
import Image from 'next/image'
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
    <header className="border-b border-[var(--border-glass)] bg-[var(--bg-glass)] backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container-responsive h-20 flex items-center justify-between gap-4">
        <div className="flex items-center">
          <Link href="/" className="focus-ring flex items-center gap-2" aria-label="Mamasan Life トップへ" title="Mamasan Life">
            <Image
              src="/icons/site-logo.png"
              alt="Mamasan Life"
              width={180}
              height={64}
              className="hidden md:block h-16 w-auto"
              priority
            />
            <Image
              src="/icons/site-logo.png"
              alt="Mamasan Life"
              width={160}
              height={56}
              className="md:hidden h-14 w-auto"
              priority
            />
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-widest uppercase text-[var(--c-primary)]" aria-label="ユーティリティナビゲーション">
          <Link href="/about" className="hover:opacity-60 transition-opacity focus-ring">Intro</Link>
          <Link href="/site-map" className="hover:opacity-60 transition-opacity focus-ring">Index</Link>
          <Link href="/contact" className="hover:opacity-60 transition-opacity focus-ring">Contact</Link>
        </nav>
        <div className="hidden md:block min-w-[260px] w-72">
          <Suspense fallback={<div className="h-9" />}>
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
          <div className="md:hidden flex flex-col items-center gap-0.5 leading-none">
            <span className="text-[10px] text-white font-semibold tracking-tight whitespace-nowrap">更新お知らせをLINEで受け取る</span>
            <LineFollowButton
              href={process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL}
              label="追加する"
              size="sm"
              variant="outlineWhite"
              className="px-3 py-1.5 text-xs leading-none"
            />
          </div>
        )}
        <button
          className="md:hidden text-[var(--c-primary)] rounded-md focus-ring p-2 hover:bg-black/5"
          aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
          aria-controls="mobileMenu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg>
        </button>
      </div>
      {open && (
        <div id="mobileMenu" className="md:hidden border-t bg-primary border-primary">
          <div className="container-responsive py-3 text-white/90 text-sm flex flex-col gap-3" role="navigation" aria-label="モバイルメニュー">
            <Suspense fallback={null}>
              <SearchForm />
            </Suspense>
            <ul className="flex flex-col gap-2">
              <li><Link href="/about" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 focus-ring">自己紹介</Link></li>
              <li><Link href="/site-map" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 focus-ring">サイトマップ</Link></li>
              <li><Link href="/contact" onClick={() => setOpen(false)} className="rounded-md px-2 py-1 focus-ring">お問い合わせ</Link></li>
            </ul>
            <div className="opacity-80 mt-1">— Categories —</div>
            <ul className="flex flex-col gap-1">
              {cats.map(c => (
                <li key={c.href}><Link href={c.href} onClick={() => setOpen(false)} className="pl-1 rounded-md px-1 py-1 focus-ring">{c.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* 下段ナビは別コンポーネント（CategoryCarousel）で表現 */}
    </header>
  )
}
