import Image from 'next/image'
import Link from 'next/link'

export type PostCardProps = {
  slug: string
  title: string
  excerpt?: string
  date?: string
  categories?: { title: string; slug: string }[]
  tags?: { title: string; slug: string }[]
  imageUrl?: string
  rank?: number
  ribbonLabel?: string
  ribbonColor?: string
  ribbonBlink?: boolean
  style?: React.CSSProperties
}

export function PostCard({ slug, title, excerpt, date, categories, tags, imageUrl, rank, ribbonLabel, ribbonColor, ribbonBlink, style }: PostCardProps) {
  return (
    <article data-reveal className="relative border border-brand-300 rounded-lg overflow-hidden bg-white/70 hover:shadow-sm transition-shadow" style={style}>
      {(typeof rank === 'number' || ribbonLabel) && (() => {
        const isGold = ribbonColor === '#EED203' || (typeof rank === 'number' && !ribbonLabel)
        const cls = `ribbon ${isGold ? 'gold' : 'red'}`
        const style = !isGold && ribbonColor ? { background: ribbonColor } : undefined
        const label = ribbonLabel || `No.${rank}`
        return (
          <div className={cls} style={style}>
            <span className={`${ribbonBlink ? 'blink' : ''}`} style={isGold ? { color: '#3F2C23' } : undefined}>{label}</span>
          </div>
        )
      })()}
      <Link href={`/blog/${slug}`} className="block">
        <div className="relative w-full aspect-[16/9] bg-brand-300/50">
          {imageUrl && <Image src={imageUrl} alt={title} fill className="object-cover" />}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2 text-gray-900">{title}</h3>
          {excerpt && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{excerpt}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
            {date && <time className="text-brand-700" dateTime={date}>{new Date(date).toLocaleDateString('ja-JP')}</time>}
            {categories?.map(c => (
              <Link key={c.slug} href={`/blog/category/${c.slug}`} className="category-badge">{c.title}</Link>
            ))}
            {tags?.slice(0, 3).map(t => (
              <Link key={t.slug} href={`/blog/tag/${t.slug}`} className="tag-badge">#{t.title}</Link>
            ))}
          </div>
        </div>
      </Link>
    </article>
  )
}
