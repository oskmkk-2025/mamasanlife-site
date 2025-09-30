"use client"
import { useEffect, useState } from 'react'
import { SectionHeader } from './SectionHeader'
import { PostList } from './PostList'

type Post = { slug:string; category:string; title:string; excerpt?:string; date?:string; imageUrl?:string }
type Group = { slug:string; title:string; posts: Post[] }

export function CategoryTicker({ groups, interval=5000 }: { groups: Group[]; interval?: number }) {
  const [i, setI] = useState(0)
  useEffect(()=>{ const id = setInterval(()=> setI(v => (v+1) % groups.length), interval); return ()=> clearInterval(id) },[groups.length, interval])
  const g = groups[i]
  return (
    <section className="container-responsive py-6">
      <SectionHeader title={`カテゴリ別・新着（${g.title}）`} />
      <PostList posts={g.posts as any} />
    </section>
  )
}

