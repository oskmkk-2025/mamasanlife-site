export default function ContactPage(){
  return (
    <main className="container-responsive py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-emphasis">お問い合わせ</h1>
      <p className="mt-4 leading-7">
        ご意見・ご要望・お仕事のご相談は、下記フォームからお送りください。内容を確認のうえ、通常2〜3営業日以内にご返信いたします。
      </p>
      <div className="mt-6">
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSe-2FHoF1qFkVsDElmDbDZI_tiXunozsiBABBUzdFG8qsuedw/viewform?embedded=true"
          width="100%"
          height="900"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
        >
          読み込んでいます…
        </iframe>
      </div>
    </main>
  )
}
