import Image from 'next/image'
import Link from 'next/link'

export type PostCardProps = {
  slug: string
  category: string
  title: string
  excerpt?: string
  date?: string
  imageUrl?: string
}

export function PostCard({ slug, category, title, excerpt, date, imageUrl }: PostCardProps) {
  return (
    <article className="border rounded-lg overflow-hidden bg-white/80 hover:shadow-sm transition-shadow">
      <Link href={`/${category}/${slug}`} className="block">
        <div className="relative w-full aspect-[16/9] bg-white/60">
          {imageUrl && <Image src={imageUrl} alt={title} fill className="object-cover" />}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2 text-gray-900">{title}</h3>
          {excerpt && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{excerpt}</p>}
          <div className="mt-3 text-xs text-gray-500">
            {date && <time dateTime={date}>{new Date(date).toLocaleDateString('ja-JP')}</time>}
          </div>
        </div>
      </Link>
    </article>
  )
}
