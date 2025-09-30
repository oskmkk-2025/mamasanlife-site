"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { categories } from '@/lib/queries'
import { CategoryIllustration } from './CategoryIllustrations'

const items = categories.map(c => ({ href: `/${c.slug}`, label: c.title }))

export function CategoryCarousel() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % items.length), 5000)
    return () => clearInterval(id)
  }, [])
  const curr = items[index]
  const next = () => setIndex(i => (i + 1) % items.length)
  const prev = () => setIndex(i => (i - 1 + items.length) % items.length)
  return (
    <div className="w-full border-b" style={{ borderColor:'#8CB9BD', background:'#fff' }}>
      <div className="container-responsive py-3 flex items-center justify-between gap-4">
        <button aria-label="prev" onClick={prev} className="text-gray-500 hover:text-gray-700">‹</button>
        <Link href={curr.href} className="flex-1">
          <div className="card px-4 py-3 flex items-center gap-4">
            <CategoryIllustration slug={curr.href.replace('/','')} size={56} />
            <div>
              <span className="text-xs text-gray-600">カテゴリー</span>
              <div className="text-lg font-semibold" style={{ color:'#B67352' }}>{curr.label}</div>
            </div>
          </div>
        </Link>
        <button aria-label="next" onClick={next} className="text-gray-500 hover:text-gray-700">›</button>
      </div>
    </div>
  )
}
