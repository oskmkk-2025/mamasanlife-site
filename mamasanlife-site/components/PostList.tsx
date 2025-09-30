import { PostCard, type PostCardProps } from './PostCard'

export function PostList({ posts }: { posts: PostCardProps[] }) {
  if (!posts?.length) return <p className="text-sm text-gray-500">記事がありません。</p>
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <PostCard key={`${p.category}/${p.slug}`} {...p} />
      ))}
    </div>
  )
}

