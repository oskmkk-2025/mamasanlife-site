"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export function SearchBox() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  useEffect(() => {
    setQ(params.get('q') ?? '')
  }, [params])

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateQuery = (value: string) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const sp = new URLSearchParams(params.toString())
      if (value) sp.set('q', value)
      else sp.delete('q')
      router.push(`/blog?${sp.toString()}`)
    }, 300)
  }

  return (
    <input
      type="search"
      placeholder="記事を検索"
      value={q}
      onChange={(e) => { setQ(e.target.value); updateQuery(e.target.value) }}
      className="w-full md:w-80 border rounded-md px-3 py-2 text-sm"
    />
  )
}
