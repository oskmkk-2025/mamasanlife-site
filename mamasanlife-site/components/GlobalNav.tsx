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
    <nav className="w-full border-b bg-white border-primary" aria-label="グローバルナビゲーション">
      <ul className="container-responsive h-12 flex items-center gap-4 overflow-x-auto text-sm text-gray-800">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href)
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap py-2 px-2 rounded-md focus-ring ${active ? 'font-semibold text-emphasis' : ''}`}
                style={active ? { borderBottom:'2px solid var(--c-emphasis)' } : {}}
              >
                {it.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
