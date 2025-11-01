import Image from 'next/image'

const missionItems = [
  '家計管理や保険の見直しなど「お金の整え方」を等身大の目線で共有すること',
  '子育て・家事・働き方の両立で得た体験を、同じ境遇のママに還元すること',
  '暮らしを楽しむアイデア（旅行・ライフハック・推しアイテム）を発信し、家族の時間を大切にすること'
]

const timeline = [
  {
    year: '社会人スタート',
    title: '事務職と家計管理の二刀流',
    body: '大学卒業後から事務職としてキャリアを積みながら、家計簿と貯蓄を継続。親からの経済的支援に頼らず「自分たちの収入で暮らしを支える」姿勢を大切にしてきました。'
  },
  {
    year: '育児期',
    title: 'ワンオペ子育てと両立',
    body: '2児の育児とパート勤務を両立。住宅ローンや学資保険、保険の見直しなどを通じて、家計の土台づくりに集中しました。'
  },
  {
    year: '学び直しのきっかけ',
    title: 'お金の学びを本格化',
    body: 'コロナ禍を機に本格的に金融リテラシーを学習。FP3級を取得し、投資や保険の見直しを実践して資産形成の加速に成功。'
  },
  {
    year: '住宅ローン完済',
    title: '資格取得と住宅ローン完済',
    body: '職業訓練校で簿記3級・2級、FP2級に合格。財形貯蓄を解約して住宅ローンを10年で完済し、新ブログ「ママさんマネー部」を開設。'
  },
  {
    year: '暮らしの再設計',
    title: 'ライフスタイルの転換',
    body: '健康志向が高まり、運動・禁煙・禁酒に挑戦。必要な保険を残しつつ多くを解約し、暮らしと資産のバランスを取り直しました。週4日の事務パートと家庭を両立しながら、準富裕層を目指した蓄財を継続しています。'
  },
  {
    year: '2025.11',
    title: 'Mamasan Life へ',
    body: 'ブランド名を「Mamasan Life」に刷新。長年親しんだ「ママさんマネー部」から看板を掛け替え、暮らし全体をサポートする新ブランドとしてスタートしました。'
  },
  {
    year: '現在',
    title: '事務スキルを再武装',
    body: 'パート契約の満了に伴い、現在は半年間の職業訓練校（Webクリエイト科）で学び直し中。デザインやコーディングを磨き、在宅ワークとブログ運営の両立を目指しています。'
  }
]

const values = [
  {
    title: 'どんな人？',
    body: [
      'オフィスワーク歴20年超の“縁の下の力持ちタイプ”。困っている人を助けたい気持ちからブログ執筆を続けています。',
      '家族は夫と高校生・中学生の子ども2人＋保護猫。旅行や家族イベントをこよなく愛するフットワーク軽めのママです。',
      '2025年は職業訓練校に通い、Webデザイン／コーディングのスキルをブラッシュアップ中。'
    ]
  },
  {
    title: '大切にしていること',
    body: [
      '「家族の青春は一度きり」――忙しい日々でも思い出づくりを惜しまないこと。',
      'お金の不安を減らすために、家計簿・投資・保険の見直しなどを丁寧に続けること。',
      'ママが“自分の時間”と“働き方”を納得できるよう、無理のない働き方を模索し続けること。'
    ]
  },
  {
    title: 'これからの目標',
    body: [
      '新NISAなどの制度を活かしながら、学費と老後資金を堅実に準備すること。',
      'Webデザインやサイト運営の知識を在宅ワークにも活かしつつ、暮らし・教育・働き方・旅行のノウハウを記事化して読者同士の「気づき」が広がる場をつくること。'
    ]
  }
]

export default function AboutPage() {
  return (
    <main className="container-responsive py-12 max-w-4xl space-y-10">
      <header className="space-y-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
          <div className="flex flex-col items-center text-center md:text-left">
            <div className="overflow-hidden rounded-full border border-[var(--c-accent-light)] bg-white p-1 shadow-sm">
              <Image
                src="/images/mamasan.PNG"
                alt="ひーちママのアイコン"
                width={96}
                height={96}
                className="h-20 w-20 object-cover"
                priority
              />
            </div>
            <span className="mt-2 text-xs font-medium text-gray-500">ひーちママ</span>
          </div>
          <div className="w-full space-y-4 text-center md:flex-1 md:text-left">
            <h1 className="text-4xl font-bold text-emphasis">運営者について</h1>
            <div className="rounded-2xl border border-[var(--c-accent-light)] bg-white/80 px-5 py-4 text-left text-gray-700 shadow-sm">
              <p className="text-lg leading-8">
                はじめまして、Mamasan Life（旧ママさんマネー部）を運営している「ひーちママ」です。
                事務職として20年以上働きつつ、子育て・暮らし・お金の悩みに寄り添う情報をブログで発信してきました。
                2025年からは職業訓練校のWebクリエイト科に通い、在宅ワークにも活かせるデザインとコーディングを実戦的に学んでいます。
                家庭で得たリアルな体験をとことん掘り下げ、ママが毎日をちょっとラクに、ちょっとハッピーにできるヒントを届けていきます。
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-emphasis">サイトのミッション</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-7">
          {missionItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-emphasis">自己紹介</h2>
        {values.map((block) => (
          <article key={block.title} className="bg-white border rounded-lg p-6 space-y-3">
            <h3 className="text-xl font-semibold">{block.title}</h3>
            <div className="space-y-2 text-gray-700 leading-7">
              {block.body.map((text, idx) => (
                <p key={idx}>{text}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-emphasis">歩みとマネーハイライト</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {timeline.map((item) => (
            <article key={item.year} className="border rounded-lg bg-white p-5 space-y-2">
              <div className="text-sm font-semibold text-[var(--c-accent)]">{item.year}</div>
              <h3 className="text-lg font-semibold text-emphasis">{item.title}</h3>
              <p className="text-gray-700 leading-7">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-emphasis">読者のみなさまへ</h2>
        <p className="text-gray-700 leading-7">
          ママの暮らしは、家計も時間も体力もフル稼働。だからこそ、
          「やってよかった」「失敗したけど役立った」経験をシェアして、負担を少しでも減らしたい――そんな思いで記事を書いています。
        </p>
        <p className="text-gray-700 leading-7">
          これからも、家族の思い出づくりと資産形成の両立に挑みながら、リアルな情報を発信していきます。いつでも気軽にコメントやお問い合わせをお寄せください。
        </p>
      </section>
    </main>
  )
}
