import Link from 'next/link'

export function CategoryBadge({ slug, title }: { slug: string; title: string }) {
  return (
    <Link href={`/blog/category/${slug}`} className="category-badge">{title}</Link>
  )
}

