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
    <nav className="w-full border-b bg-white" style={{ borderColor:'#8CB9BD' }}>
      <div className="container-responsive h-12 flex items-center gap-4 overflow-x-auto text-sm text-gray-800">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href)
          return (
            <Link key={it.href} href={it.href}
              className={`whitespace-nowrap py-2 ${active ? 'font-semibold' : ''}`}
              style={active ? { color:'#B67352', borderBottom:'2px solid #B67352' } : {}}>
              {it.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
