import Script from 'next/script'
import { PageHeader } from '@/components/PageHeader'

export const metadata = {
  title: 'お問い合わせ',
  description: 'お仕事のご相談・お問い合わせはこちらから。'
}

export default function ContactPage() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@example.com'
  return (
    <div>
      <PageHeader title="お問い合わせ" subtitle="お仕事のご相談・コラボのご連絡はこちらから" />
      <div className="container-responsive py-10 max-w-3xl">
        <Script id="contact-ld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'お問い合わせ',
            url: `${base}/contact`
          })}
        </Script>
        <section aria-labelledby="contact-mail">
          <h2 id="contact-mail" className="text-xl font-semibold mb-4">メールで連絡する</h2>
          <p className="text-gray-700 mb-4">お仕事のご相談は以下のメール宛にご連絡ください。</p>
          <p className="text-gray-900 font-medium"><a href={`mailto:${email}`} className="underline">{email}</a></p>
          <p className="text-xs text-gray-500 mt-2">※ 連絡先は環境変数で設定できます（NEXT_PUBLIC_CONTACT_EMAIL）。</p>
        </section>
      </div>
    </div>
  )
}
