import Link from 'next/link'

type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (!items?.length) return null
  const last = items.length - 1
  return (
    <nav aria-label="breadcrumbs" className="breadcrumbs">
      <ol className="container-responsive py-3 flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {i === last || !c.href ? (
              <span aria-current="page" className="text-gray-800 font-medium">{c.label}</span>
            ) : (
              <Link href={c.href}>{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

