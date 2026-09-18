type Heading = { id: string; text: string; level: number }

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (!headings?.length) return null
  return (
    <nav aria-label="目次" className="toc-box">
      <div className="toc-box__title">もくじ</div>
      <ul className="space-y-2">
        {headings.map(h => (
          <li key={h.id} className="truncate" style={{ paddingLeft: (h.level - 2) * 12 }}>
            <a href={`#${h.id}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
