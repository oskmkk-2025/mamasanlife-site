export const metadata = {
  title: 'Privacy Policy',
  description: 'プライバシーポリシー'
}

const sections = [
  {
    title: '運営者情報',
    body: [
      '当サイト「ママさんライフ」（https://mamasanmoney-bu.com）は、ひーちママが運営しています。'
    ]
  },
  {
    title: '取得する個人情報',
    body: [
      '当サイトにはコメント機能や会員登録機能がありません。',
      'お問い合わせは、お問い合わせフォーム（https://mamasanmoney-bu.com/contact）にて受け付けており、ご連絡いただいた際に記載された氏名・メールアドレス・本文を、内容確認と返答のために利用します。',
      'アクセス時にはサーバーログとして IP アドレス・アクセス日時・ブラウザ情報などが自動的に記録される場合があります。'
    ]
  },
  {
    title: 'Cookie の利用',
    body: [
      '当サイトでは、アクセス解析および広告配信のために Cookie を使用することがあります。Cookie は個人を特定する情報を含まず、ブラウザの設定で拒否できます。',
      'Cookie を無効にした場合、一部コンテンツが正しく表示されない可能性があります。'
    ]
  },
  {
    title: 'アクセス解析',
    body: [
      'Google Analytics を利用してサイトの利用状況を把握しています。取得データは匿名化され、個人を特定することはありません。',
      '収集されたデータは Google のプライバシーポリシーに基づいて管理されます。詳細は https://policies.google.com/privacy をご確認ください。',
      '解析を停止したい場合は、Google が提供するブラウザ用アドオンなどをご利用ください。'
    ]
  },
  {
    title: '広告配信について',
    body: [
      '当サイトでは Google AdSense などの第三者配信広告サービスを利用する場合があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie を使用することがあります。',
      'パーソナライズド広告を無効にするには、広告設定ページ（https://adssettings.google.com/）をご利用ください。'
    ]
  },
  {
    title: 'アフィリエイトプログラムについて',
    body: [
      '当サイトはAmazonアソシエイト・プログラム（Amazon.co.jp を宣伝しリンクすることによってサイトが紹介料を獲得できるアフィリエイトプログラム）および「もしもアフィリエイト」経由で Amazon 商品リンクを掲載しています。',
      'さらに、もしもアフィリエイトを通じた楽天市場・Yahoo!ショッピングのリンクをはじめ、A8.net やバリューコマースなどのアフィリエイトサービスプロバイダーに参加する場合があります。',
      'これらのリンクから商品・サービスをご購入いただくと、追加の費用負担なく運営者に紹介料が発生することがあります。'
    ]
  },
  {
    title: '個人情報の管理と第三者提供',
    body: [
      '収集した個人情報は適切に管理し、ご本人の同意がある場合または法令に基づく場合を除き第三者に提供しません。'
    ]
  },
  {
    title: '個人情報の開示・訂正・削除',
    body: [
      'ご自身の個人情報について開示・訂正・利用停止・削除などを希望される場合は、本人確認のうえ迅速に対応いたします。お問い合わせメールアドレス宛にご連絡ください。'
    ]
  },
  {
    title: 'お問い合わせ先',
    body: [
      '本ポリシーに関するお問い合わせは、サイト内の「お問い合わせ」ページ（https://mamasanmoney-bu.com/contact）からお願いいたします。'
    ]
  }
]

export default function PolicyPage() {
  return (
    <div className="container-responsive py-10 max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-emphasis mb-3">プライバシーポリシー</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          当サイトでは、訪問者の個人情報や各種データを適切に取り扱うため、以下のポリシーを定めます。
        </p>
      </header>

      <section className="space-y-6">
        {sections.map((section) => (
          <article key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold text-emphasis">{section.title}</h2>
            <div className="space-y-2 text-gray-700 leading-7">
              {section.body.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <footer className="text-xs text-gray-500">
        <p>最終更新日: 2025年10月</p>
        <p>本ポリシーは必要に応じて見直し・改定することがあります。改定後の内容は本ページに速やかに掲載します。</p>
      </footer>
    </div>
  )
}
