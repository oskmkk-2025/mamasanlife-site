import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t mt-16 bg-white" aria-label="フッター">
      <div className="container-responsive py-10 text-sm text-gray-700 grid md:grid-cols-4 gap-6">
        <section aria-labelledby="ft-about">
          <h2 id="ft-about" className="font-semibold heading-accent">About</h2>
          <p className="mt-2">ママの毎日に役立つ生活情報をお届けします。</p>
        </section>
        <nav aria-labelledby="ft-links">
          <h2 id="ft-links" className="font-semibold heading-accent">Links</h2>
          <ul className="mt-2 space-y-1">
            <li><Link href="/about">運営者情報</Link></li>
            <li><Link href="/policy">プライバシーポリシー</Link></li>
            <li><Link href="/terms">利用規約</Link></li>
            <li><Link href="/disclaimer">免責事項</Link></li>
            <li><Link href="/contact">お問い合わせ</Link></li>
            <li><Link href="/site-map">サイトマップ</Link></li>
          </ul>
        </nav>
        <div className="md:col-span-2 md:text-right text-gray-600 self-end">
          © {new Date().getFullYear()} Mamasan Life
          <span className="ml-2 text-xs text-gray-500">（formerly mamasan money-bu / ママさんマネー部）</span>
        </div>
      </div>
    </footer>
  )
}
