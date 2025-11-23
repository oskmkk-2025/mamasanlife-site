import Link from 'next/link'
import { ImgWithPlaceholder } from './ImgWithPlaceholder'
import { sanityOptimized } from '@/lib/image-util'

export type BlogCardProps = {
  href: string
  title: string
  excerpt?: string
  imageUrl?: string
  categoryTitle?: string
}

export function BlogCard({ href, title, excerpt, imageUrl, categoryTitle }: BlogCardProps) {
  return (
    <Link href={href} className="blog-card block border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow duration-150">
      <div className="flex items-start gap-4">
        <div className="w-[112px] h-[72px] sm:w-[140px] sm:h-[88px] rounded-lg overflow-hidden bg-gray-100 shrink-0">
          {imageUrl ? (
            <ImgWithPlaceholder
              src={sanityOptimized(imageUrl, { q: 75, fit: 'crop' })}
              alt={title}
              width={140}
              height={88}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">No image</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {categoryTitle && (
            <span className="chip-tag text-[11px] py-0.5 px-2 mb-1 inline-block">{categoryTitle}</span>
          )}
          <div className="font-semibold leading-snug text-[15px] sm:text-[16px] text-gray-900 line-clamp-2">{title}</div>
          {excerpt && (
            <p className="mt-1 text-[13px] text-gray-600 line-clamp-2">{excerpt}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
