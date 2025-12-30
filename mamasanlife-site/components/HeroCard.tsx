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
    <Link href={href} className="block group relative rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-2xl hover:shadow-black/5 transition-all duration-700">
      <div className="relative w-full aspect-[16/8] sm:aspect-[21/9] bg-gray-50 overflow-hidden">
        {post.imageUrl ? (
          <ImgWithPlaceholder
            src={sanityOptimized(post.imageUrl, { q: 80, fit: 'crop' })}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>
      <div className="p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--c-accent)]">{post.category}</span>
          <span className="w-8 h-[1px] bg-[var(--c-accent)] opacity-40" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--c-primary)] leading-tight group-hover:text-[var(--c-accent)] transition-colors duration-500">{post.title}</h2>
        {post.excerpt && <p className="mt-4 text-lg text-[var(--c-emphasis)] line-clamp-2 opacity-90 leading-relaxed max-w-2xl">{post.excerpt}</p>}
        {post.date && (
          <div className="mt-6 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-gray-400">
            <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('ja-JP')}</time>
          </div>
        )}
      </div>
    </Link>
  )
}
import { sanityOptimized } from '@/lib/image-util'
