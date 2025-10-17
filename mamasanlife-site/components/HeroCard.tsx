import { ImgWithPlaceholder } from './ImgWithPlaceholder'
import Link from 'next/link'

type HeroPost = {
  title: string
  slug: string
  category: string
  imageUrl?: string
  excerpt?: string
  date?: string
}

export function HeroCard({ post }: { post: HeroPost }) {
  const href = `/${post.category}/${post.slug}`
  return (
    <Link href={href} className="block group rounded-xl overflow-hidden border shadow-sm bg-white">
      <div className="relative w-full aspect-[16/7] bg-gray-100">
        {post.imageUrl ? (
          <ImgWithPlaceholder
            src={sanityOptimized(post.imageUrl, { q: 80, fit:'crop' })}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
        <div className="p-5">
        <span className="chip-accent">{post.category}</span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight" style={{ color:'#2b2b2b' }}>{post.title}</h2>
        {post.excerpt && <p className="mt-2 text-gray-600 line-clamp-2">{post.excerpt}</p>}
        {post.date && (
          <div className="mt-3 text-xs text-gray-500">
            <time dateTime={post.date}>公開: {new Date(post.date).toLocaleDateString('ja-JP')}</time>
          </div>
        )}
      </div>
    </Link>
  )}
import { sanityOptimized } from '@/lib/image-util'
