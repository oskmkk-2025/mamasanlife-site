export type FaqItem = {
    question: string
    answer: string
}

type FaqBlockProps = {
    items: FaqItem[]
}

export function FaqBlock({ items }: FaqBlockProps) {
    if (!items || items.length === 0) return null

    return (
        <section className="my-10 bg-[var(--c-cream)] rounded-xl p-6 border border-[var(--c-border)]" aria-label="よくある質問">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-[var(--c-primary)] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">Q&A</span>
                よくある質問
            </h2>
            <div className="space-y-6">
                {items.map((item, idx) => (
                    <div key={idx} className="border-b border-dashed border-[var(--c-border)] last:border-0 pb-6 last:pb-0">
                        <h3 className="text-lg font-bold text-[var(--c-emphasis)] mb-3 flex gap-3">
                            <span className="text-[var(--c-primary)] shrink-0">Q.</span>
                            <span>{item.question}</span>
                        </h3>
                        <div className="text-[var(--c-text)] leading-relaxed flex gap-3">
                            <span className="text-[var(--c-accent-ink)] font-bold shrink-0">A.</span>
                            <p className="whitespace-pre-wrap">{item.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
