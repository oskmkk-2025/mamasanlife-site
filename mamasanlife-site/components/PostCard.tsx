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
    <article className="border rounded-lg overflow-hidden bg-white/80 hover:shadow-sm transition-shadow">
      <Link href={href} className="block">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-white/60">
          {imageUrl ? (
            <ImgWithPlaceholder
              src={sanityOptimized(imageUrl, { q: 70, fit: 'crop' })}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain sm:object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs text-white inline-flex rounded-full px-3 py-1" style={{ background:'#8CB9BD' }}>{categoryTitle || category}</div>
          <h3 className="text-lg font-semibold text-gray-900 card-title sm:line-clamp-2">{title}</h3>
          {excerpt && <p className="mt-2 text-sm text-gray-600 sm:line-clamp-2 lg:line-clamp-3">{excerpt}</p>}
          <div className="mt-3 text-xs text-gray-500">
            {date && <time dateTime={date}>{new Date(date).toLocaleDateString('ja-JP')}</time>}
          </div>
        </div>
      </Link>
    </article>
  )
}
