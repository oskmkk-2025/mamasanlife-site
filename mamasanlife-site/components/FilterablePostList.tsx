"use client"
import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PostList } from './PostList'

type Cat = { slug: string; title: string }
type Post = {
  id?: string
  _id?: string
  slug: string
  category: string
  categoryTitle?: string
  title: string
  excerpt?: string
  date?: string
  imageUrl?: string
}

export function FilterablePostList({ posts, categories }: { posts: Post[]; categories: Cat[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const active = sp?.get('cat') || 'all'

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: posts.length }
    for (const c of categories) map[c.slug] = 0
    for (const p of posts) map[p.category] = (map[p.category] || 0) + 1
    return map
  }, [posts, categories])

  const filtered = useMemo(() => {
    if (active === 'all') return posts
    return posts.filter((p) => p.category === active)
  }, [posts, active])

  function onSelect(slug: string) {
    const params = new URLSearchParams(sp?.toString() || '')
    if (slug === 'all') params.delete('cat')
    else params.set('cat', slug)
    router.replace(`${pathname}${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="記事フィルター">
        <button
          type="button"
          onClick={() => onSelect('all')}
          aria-pressed={active === 'all'}
          className={`px-3 py-1.5 rounded-full border text-sm focus-ring ${active === 'all' ? 'bg-emphasis text-white border-emphasis' : 'bg-white hover:bg-gray-50'}`}
        >
          すべて ({counts.all || 0})
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onSelect(c.slug)}
            aria-pressed={active === c.slug}
            className={`px-3 py-1.5 rounded-full border text-sm focus-ring ${active === c.slug ? 'bg-emphasis text-white border-emphasis' : 'bg-white hover:bg-gray-50'}`}
          >
            {c.title} ({counts[c.slug] || 0})
          </button>
        ))}
      </div>

      <PostList posts={filtered as any} />
    </div>
  )
}
