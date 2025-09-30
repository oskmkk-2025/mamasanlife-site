import Image from 'next/image'
import Link from 'next/link'

type Props = {
  slug: string
  title: string
  excerpt?: string
  date?: string
  imageUrl?: string
}

export function FeaturedPost({ slug, title, excerpt, date, imageUrl }: Props) {
  return (
    <article data-reveal className="rounded-2xl overflow-hidden bg-white/60">
      <Link href={`/blog/${slug}`} className="block group">
        <div className="relative w-full aspect-[16/9]">
          {imageUrl && <Image src={imageUrl} alt={title} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <h3 className="text-2xl md:text-3xl font-semibold drop-shadow-sm">{title}</h3>
            {excerpt && <p className="mt-2 text-sm md:text-base text-white/90 line-clamp-2">{excerpt}</p>}
            {date && (
              <div className="mt-2 text-xs text-white/80">
                <time dateTime={date}>{new Date(date).toLocaleDateString('ja-JP')}</time>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
