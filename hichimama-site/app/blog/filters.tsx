"use client"
import { useRouter, useSearchParams } from 'next/navigation'

type Item = { title: string; slug: string }

export function CategoryFilter({ items, selected }: { items: Item[]; selected?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  return (
    <label className="flex items-center gap-2">
      <span className="text-gray-600">カテゴリー</span>
      <select
        className="border rounded-md px-2 py-1"
        value={selected || ''}
        onChange={(e) => {
          const sp = new URLSearchParams(params.toString())
          const v = e.target.value
          if (v) sp.set('category', v); else sp.delete('category')
          sp.delete('page')
          router.push(`/blog?${sp.toString()}`)
        }}
      >
        <option value="">すべて</option>
        {items?.map((c) => (
          <option key={c.slug} value={c.slug}>{c.title}</option>
        ))}
      </select>
    </label>
  )
}

export function TagFilter({ items, selected }: { items: Item[]; selected?: string }) {
  const router = useRouter()
  const params = useSearchParams()
  return (
    <label className="flex items-center gap-2">
      <span className="text-gray-600">タグ</span>
      <select
        className="border rounded-md px-2 py-1"
        value={selected || ''}
        onChange={(e) => {
          const sp = new URLSearchParams(params.toString())
          const v = e.target.value
          if (v) sp.set('tag', v); else sp.delete('tag')
          sp.delete('page')
          router.push(`/blog?${sp.toString()}`)
        }}
      >
        <option value="">すべて</option>
        {items?.map((t) => (
          <option key={t.slug} value={t.slug}>{t.title}</option>
        ))}
      </select>
    </label>
  )
}

