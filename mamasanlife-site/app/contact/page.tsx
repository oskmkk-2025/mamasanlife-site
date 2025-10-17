export default function ContactPage(){
  return (
    <main className="container-responsive py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-emphasis">お問い合わせ</h1>
      <p className="mt-4 leading-7">ご意見・ご感想・ご連絡は以下のメール宛にお願いします。</p>
      <div className="mt-4 p-4 bg-white border rounded-md">
        <div className="text-sm">メール: <a className="underline" href="mailto:contact@example.com">contact@example.com</a></div>
      </div>
    </main>
  )
}

