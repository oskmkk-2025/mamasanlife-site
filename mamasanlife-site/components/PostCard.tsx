import { ImgWithPlaceholder } from './ImgWithPlaceholder'
import Link from 'next/link'
import { sanityOptimized } from '@/lib/image-util'

export type PostCardProps = {
  slug: string
  category: string
  categoryTitle?: string
  title: string
  excerpt?: string
  date?: string
  imageUrl?: string
  id?: string
  _id?: string
}

export function PostCard({ slug, category, categoryTitle, title, excerpt, date, imageUrl }: PostCardProps) {
  const href = category ? `/${category}/${slug}` : `/${slug}`
  return (
    <article className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 ease-out">
      <Link href={href} className="block">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-white/60">
          {imageUrl ? (
            <ImgWithPlaceholder
              src={sanityOptimized(imageUrl, { q: 70, fit: 'crop' })}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--c-accent)]">{categoryTitle || category}</span>
            <span className="w-4 h-[1px] bg-[var(--c-accent)] opacity-30" />
          </div>
          <h3 className="text-lg font-bold text-[var(--c-primary)] leading-snug card-title sm:line-clamp-2 transition-colors duration-300 group-hover:text-[var(--c-accent)]">{title}</h3>
          {excerpt && <p className="mt-3 text-sm text-[var(--c-emphasis)] leading-relaxed sm:line-clamp-2 opacity-80">{excerpt}</p>}
          <div className="mt-3 text-xs text-gray-500">
            {date && <time dateTime={date}>{new Date(date).toLocaleDateString('ja-JP')}</time>}
          </div>
        </div>
      </Link>
    </article>
  )
}
