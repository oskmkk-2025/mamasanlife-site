type Heading = { id: string; text: string; level: number }

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (!headings?.length) return null
  return (
    <nav aria-label="目次" className="border rounded-md p-4 bg-gray-50 text-sm">
      <div className="font-semibold mb-2">目次</div>
      <ul className="space-y-2">
        {headings.map(h => (
          <li key={h.id} className="truncate" style={{ paddingLeft: (h.level - 2) * 12 }}>
            <a href={`#${h.id}`} className="hover:text-[#B67352]">{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
