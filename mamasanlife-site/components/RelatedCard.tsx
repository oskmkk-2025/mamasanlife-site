import Link from 'next/link'
import { ImgWithPlaceholder } from './ImgWithPlaceholder'
import { sanityOptimized } from '@/lib/image-util'

export type RelatedCardProps = {
  href: string
  title: string
  excerpt?: string
  imageUrl?: string
  categoryTitle?: string
}

export function RelatedCard({ href, title, excerpt, imageUrl, categoryTitle }: RelatedCardProps){
  return (
    <Link href={href} className="block border rounded-md bg-white hover:shadow-sm transition-shadow p-3">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-[112px] h-[70px] sm:w-[128px] sm:h-[80px] rounded overflow-hidden bg-gray-100">
          {imageUrl ? (
            <ImgWithPlaceholder
              src={sanityOptimized(imageUrl, { q: 70, fit:'crop' })}
              alt={title}
              width={128}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[11px]">No Image</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {categoryTitle && (
            <span className="chip-tag text-[11px] py-0.5 px-2 mb-1 inline-block">{categoryTitle}</span>
          )}
          <div className="font-semibold leading-snug line-clamp-2 text-[15px] text-gray-900">{title}</div>
          {excerpt && (
            <p className="mt-1 text-[13px] text-gray-600 line-clamp-2">{excerpt}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

