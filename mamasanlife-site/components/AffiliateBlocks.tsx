import { HtmlEmbed } from './HtmlEmbed'

type AffiliateItem = { title?: string; html?: string; note?: string }

export function AffiliateBlocks({ items }: { items?: AffiliateItem[] }) {
  if (!Array.isArray(items) || !items.length) return null
  return (
    <section className="affiliate-blocks mt-6 space-y-4" aria-label="おすすめリンク">
      {items.map((item, index) => {
        const key = `${item.title || ''}-${item.html || ''}-${item.note || ''}-${index}`
        return (
          <article key={key} className="affiliate-block">
            {item.title && <p className="affiliate-block__title">{item.title}</p>}
            {item.html && (
              <div className="affiliate-block__body">
                <HtmlEmbed html={item.html} />
              </div>
            )}
            {item.note && <p className="affiliate-block__note">{item.note}</p>}
          </article>
        )
      })}
    </section>
  )
}
