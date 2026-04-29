import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-[var(--c-border)] mt-16 bg-white" aria-label="フッター">
      <div className="container-responsive py-10 text-sm text-gray-600 grid md:grid-cols-4 gap-8">

        <section aria-labelledby="ft-about" className="md:col-span-2">
          <h2 id="ft-about" className="heading-accent text-base mb-3">Mamasan Life</h2>
          <p className="text-[var(--c-text)] leading-7">
            ママの毎日に役立つ生活情報をお届けします。<br />
            家計・暮らし・子育てのリアルな体験をシェア中。
          </p>
        </section>

        <nav aria-labelledby="ft-links">
          <h2 id="ft-links" className="heading-accent text-base mb-3">Links</h2>
          <ul className="space-y-1.5">
            {[
              { href: '/about',      label: '運営者情報' },
              { href: '/policy',     label: 'プライバシーポリシー' },
              { href: '/terms',      label: '利用規約' },
              { href: '/disclaimer', label: '免責事項' },
              { href: '/contact',    label: 'お問い合わせ' },
              { href: '/site-map',   label: 'サイトマップ' },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="hover:text-[var(--c-primary)] transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-1 flex flex-col justify-end text-right text-xs text-[var(--c-muted)]">
          <p>© {new Date().getFullYear()} Mamasan Life</p>
          <p className="mt-1">formerly mamasan money-bu</p>
        </div>

      </div>
    </footer>
  )
}
