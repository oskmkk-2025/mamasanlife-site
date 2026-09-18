type TimelineItem = { _key?: string; time?: string; label?: string; text?: string }

export function TimelineBlock({ title, items, summary }: { title?: string; items?: TimelineItem[]; summary?: string }) {
  const list = (items || []).filter((it) => it?.time || it?.label)
  if (!list.length) return null
  return (
    <section className="timeline" aria-label={title || '時系列'}>
      {title && <p className="timeline__title">{title}</p>}
      <ol className="timeline__list">
        {list.map((it, i) => (
          <li key={it._key || i} className="timeline__item">
            <span className="timeline__time">{it.time}</span>
            <div className="timeline__body">
              <p className="timeline__label">{it.label}</p>
              {it.text && <p className="timeline__text">{it.text}</p>}
            </div>
          </li>
        ))}
      </ol>
      {summary && <p className="timeline__summary">{summary}</p>}
    </section>
  )
}
