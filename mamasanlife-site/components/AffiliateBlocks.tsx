export function AffiliateBlocks({ items }: { items?: { title?: string; html?: string; note?: string }[] }) {
  if (!items?.length) return null
  return (
    <section className="mt-8 space-y-4">
      {items.map((b, i) => (
        <div key={i} className="border rounded-md p-4 bg-white">
          {b.title && <div className="font-semibold mb-2">{b.title}</div>}
          {b.html && <div dangerouslySetInnerHTML={{ __html: b.html }} />}
          {b.note && <div className="text-xs text-gray-500 mt-2">{b.note}</div>}
        </div>
      ))}
    </section>
  )
}

