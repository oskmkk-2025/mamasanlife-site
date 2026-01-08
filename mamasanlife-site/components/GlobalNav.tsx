"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/money', label: 'お金・家計管理' },
  { href: '/parenting', label: '子育て・教育' },
  { href: '/life', label: '暮らし・家事' },
  { href: '/work', label: '働き方・キャリア' },
  { href: '/health', label: '心と健康' },
  { href: '/feature', label: '特集' },
]

export function GlobalNav() {
  const pathname = usePathname()
  return (
    <nav className="w-full border-b border-[var(--border-glass)] bg-[var(--bg-glass)] backdrop-blur-md sticky top-24 md:top-32 z-40" aria-label="グローバルナビゲーション">
      <ul className="container-responsive h-14 flex items-center gap-8 overflow-x-auto text-[13px] font-medium tracking-widest uppercase text-[var(--c-emphasis)] scrollbar-hide">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href)
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap py-1 transition-all duration-300 relative ${active ? 'text-[var(--c-primary)] font-bold' : 'hover:text-[var(--c-primary)]'}`}
              >
                {it.label}
                {active && (
                  <span className="absolute -bottom-[11px] left-0 w-full h-0.5 bg-[var(--c-accent)]" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
