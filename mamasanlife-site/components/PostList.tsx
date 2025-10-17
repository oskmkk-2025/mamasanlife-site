import { PostCard, type PostCardProps } from './PostCard'

type CardLike = PostCardProps & { id?: string; _id?: string }

export function PostList({ posts }: { posts: CardLike[] }) {
  if (!posts?.length) return <p className="text-sm text-gray-500">記事がありません。</p>
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p, i) => {
        const base = (p as any).id || (p as any)._id || `${p.category || 'unknown'}/${p.slug}`
        const key = ((p as any).id || (p as any)._id) ? String(base) : `${base}-${i}`
        return <PostCard key={key} {...p} />
      })}
    </div>
  )
}
