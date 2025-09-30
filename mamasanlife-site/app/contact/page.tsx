export const metadata = { title: 'Contact', description: 'お問い合わせ' }

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@example.com'
  return (
    <div className="container-responsive py-10 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">お問い合わせ</h1>
      <p className="text-gray-700 mb-4">お仕事のご相談は以下のメール宛にご連絡ください。</p>
      <p className="text-gray-900 font-medium"><a href={`mailto:${email}`} className="underline">{email}</a></p>
    </div>
  )
}

