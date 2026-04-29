type SummaryBlockProps = {
    title?: string
    items: string[]
}

export function SummaryBlock({ title = 'この記事のポイント', items }: SummaryBlockProps) {
    if (!items || items.length === 0) return null

    return (
        <div className="my-10 bg-[var(--c-bg)] border-2 border-[var(--c-primary)] rounded-2xl p-6 md:p-8 relative overflow-hidden">
            {/* Decorative paw icons */}
            <div className="absolute -top-4 -right-4 text-[var(--c-primary)] opacity-10 text-6xl rotate-12" aria-hidden="true">
                <i className="fas fa-paw"></i>
            </div>
            <div className="absolute -bottom-4 -left-4 text-[var(--c-primary)] opacity-10 text-6xl -rotate-12" aria-hidden="true">
                <i className="fas fa-paw"></i>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-[var(--c-emphasis)] mb-6 flex items-center gap-3">
                <span className="bg-[var(--c-primary)] text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                    <i className="fas fa-check text-sm"></i>
                </span>
                {title}
            </h2>
            <ul className="space-y-4">
                {items.map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-[17px] md:text-[18px] leading-relaxed text-gray-800">
                        <span className="text-[var(--c-primary)] font-bold shrink-0 mt-1">・</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
