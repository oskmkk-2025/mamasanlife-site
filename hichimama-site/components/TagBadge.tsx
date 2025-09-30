import Link from 'next/link'

export function TagBadge({ slug, title }: { slug: string; title: string }) {
  return (
    <Link href={`/blog/tag/${slug}`} className="tag-badge">#{title}</Link>
  )
}

