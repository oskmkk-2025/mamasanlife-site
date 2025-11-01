import Link from 'next/link'

type Props = {
  codocUrl?: string
  priceLabel?: string
  message?: string
}

/**
 * Paywall notice that invites the reader to continue the article on codoc.
 */
export function PaywallNotice({ codocUrl, priceLabel, message }: Props) {
  const priceText = priceLabel || '有料'
  return (
    <div className="mt-8 space-y-3 rounded-xl border border-[var(--c-accent-light)] bg-white/90 p-6 text-center shadow-sm">
      <p className="text-base font-semibold text-[var(--c-emphasis)]">
        この記事の続きは codoc で公開しています。
      </p>
      {message && <p className="text-sm leading-relaxed text-gray-600">{message}</p>}
      {codocUrl ? (
        <div className="flex flex-col items-center gap-2">
          <Link
            href={codocUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-2 rounded-full border-2 border-[var(--c-accent)] px-5 py-2 text-sm font-bold text-[var(--c-accent)] transition-colors hover:bg-[var(--c-accent)] hover:text-white"
          >
            <span>codocで続きを読む</span>
            <span className="rounded-full bg-[var(--c-accent-light)] px-2 py-0.5 text-xs font-medium text-[var(--c-accent)]/80">
              {priceText}
            </span>
          </Link>
          <p className="text-xs text-gray-500">購入後は codoc のマイページからいつでも読み返せます。</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">有料部分の公開準備中です。リンクが整い次第、こちらからご案内いたします。</p>
      )}
    </div>
  )
}

