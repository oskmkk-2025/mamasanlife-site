import Link from 'next/link'
import AffiliateCtaButton from '@/components/AffiliateCtaButton'

// ひーちママの愛用品（楽天ROOMへの入口）。2026-10-08 本人「楽天ROOMへ誘導するページを作って」
// ⚠️載せるのは、本人が実際に使っていて楽天ROOMに投稿している物だけ（一言は本人のROOMの紹介文から）。
// ⚠️セールの値段・〇%OFF・期限は書かない（すぐ古くなって嘘になるため）。値段はリンク先で確認してもらう。
export const metadata = {
  title: 'ひーちママの愛用品｜実際に使ってよかった物だけ',
  description:
    'FP2級ママのひーちママが、実際に使ってよかった物だけを集めました。猫のケージ、黒カビ取り、ドライヤー、簿記・FPの教科書など。くわしい感想は楽天ROOMで紹介しています。',
  alternates: { canonical: '/favorites' },
}

const ROOM = 'https://room.rakuten.co.jp/hiichimama'

type Item = {
  id: string // 楽天ROOMの投稿ID
  name: string
  img: string
  note: string // 本人の一言（ROOMの紹介文から）
  article?: { href: string; label: string }
}

const groups: { title: string; lead: string; items: Item[] }[] = [
  {
    title: '家事・掃除',
    lead: 'ラクにきれいが続く物',
    items: [
      {
        id: '1700393179794339',
        name: 'かびとりいっぱつ（黒カビ取りジェル）',
        img: 'https://room.r10s.jp/d/strg/ctrl/22/50a92ca0434cdb52b27b0fbb4a6601b71a550ddf.82.9.22.3.jpg?thum=133&fitin=400:400',
        note: 'お風呂のフタのゴムパッキンや窓枠のシリコンの黒カビに。塗って半日置いたら消えていました。塩素系なので換気と手袋を忘れずに。',
        article: { href: '/life/bathroom-cleaning', label: '浴室クリーニングの体験談' },
      },
    ],
  },
  {
    title: '時短家電・身じたく',
    lead: '毎日の数分が短くなる物',
    items: [
      {
        id: '1700394260328186',
        name: 'Aglaia&（アグライア）ドライヤー',
        img: 'https://room.r10s.jp/d/strg/ctrl/22/384e1141dd7124e2b926aa4a57410f7526c4236b.82.9.22.3.jpg?thum=133&fitin=400:400',
        note: '約310gと軽くて腕が疲れない。熱くないのにすぐ乾くので、お風呂上がりのドライヤー時間がラクになりました。',
      },
      {
        id: '1700393489878539',
        name: 'こするだけのナノガラス除毛',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/kotakasi0217/cabinet/12165513/13512204/imgrc0106449101.jpg?_ex=400x400',
        note: 'カミソリを卒業。お手入れがラクで、子どもたちもお風呂で使っています。',
      },
    ],
  },
  {
    title: '猫との暮らし',
    lead: 'ねこを迎えるときに',
    items: [
      {
        id: '1700395727964131',
        name: 'アイリスオーヤマ キャットケージ（3段・2段）',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/cat-land/cabinet/eigyou/i332157.jpg?_ex=400x400',
        note: 'ねこを迎えたときに買いました。女性1人でも組み立てられて、広くて掃除しやすいのでおすすめです。',
        article: { href: '/feature/protection-cat', label: '保護猫譲渡会の記事' },
      },
    ],
  },
  {
    title: '簿記3級',
    lead: '職業訓練校で合格したときの教材',
    items: [
      {
        id: '1700396158085752',
        name: 'みんなが欲しかった！簿記の教科書 日商3級 商業簿記',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0668/9784300120668_1_42.jpg?_ex=400x400',
        note: '職業訓練校の指定教材でした。数字が苦手な私でも、図が多くて読み進めやすかったです。私が使ったのは前の版です。',
        article: { href: '/work/qualification-nissho-bookkeeping3-test', label: '簿記3級に合格した体験談' },
      },
      {
        id: '1700396158161282',
        name: 'みんなが欲しかった！簿記の問題集 日商3級 商業簿記',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0699/9784300120699_1_42.jpg?_ex=400x400',
        note: '教科書とセットで使った問題集。教科書の章ごとに解けるので、習ったところをすぐ確かめられました。',
        article: { href: '/work/qualification-nissho-bookkeeping3-test', label: '簿記3級に合格した体験談' },
      },
      {
        id: '1700396158203272',
        name: '日商簿記3級 まるっと完全予想問題集',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0774/9784300120774_1_46.jpg?_ex=400x400',
        note: '本番と同じ60分で、全10回を90点以上めざして3周。そのあとネット試験を受けて合格しました。',
        article: { href: '/work/qualification-nissho-bookkeeping3-test', label: '簿記3級に合格した体験談' },
      },
    ],
  },
  {
    title: '簿記2級',
    lead: '一発合格したときの教科書と問題集',
    items: [
      {
        id: '1700395731473420',
        name: 'みんなが欲しかった！簿記の教科書 日商2級 商業簿記',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0675/9784300120675_1_49.jpg?_ex=400x400',
        note: '図が多くて、独学でも読み進めやすかったシリーズ。私が使ったのは前の版です。',
        article: { href: '/work/qualification-nissho-bookkeeping2-test', label: '簿記2級に合格した体験談' },
      },
      {
        id: '1700395731173388',
        name: 'みんなが欲しかった！簿記の教科書 日商2級 工業簿記',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0682/9784300120682_1_49.jpg?_ex=400x400',
        note: '商業簿記とあわせて使いました。私が使ったのは前の版です。',
        article: { href: '/work/qualification-nissho-bookkeeping2-test', label: '簿記2級に合格した体験談' },
      },
      {
        id: '1700396158252421',
        name: 'みんなが欲しかった！簿記の問題集 日商2級 商業簿記',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0705/9784300120705_1_49.jpg?_ex=400x400',
        note: '訓練校では宿題に出された問題集。教科書とセットで使って、2級に一発合格できました。',
        article: { href: '/work/qualification-nissho-bookkeeping2-test', label: '簿記2級に合格した体験談' },
      },
      {
        id: '1700396158292426',
        name: 'みんなが欲しかった！簿記の問題集 日商2級 工業簿記',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0712/9784300120712_1_49.jpg?_ex=400x400',
        note: '訓練校の授業で教わった解き方のコツを、この問題集で練習しました。',
        article: { href: '/work/qualification-nissho-bookkeeping2-test', label: '簿記2級に合格した体験談' },
      },
      {
        id: '1700396158340384',
        name: '日商簿記2級 まるっと完全予想問題集',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0781/9784300120781_1_44.jpg?_ex=400x400',
        note: '統一試験にもネット試験にも使えて、紙でもPCでも解けます。あれこれ手を出すより、この1冊をくり返すのがおすすめ。',
        article: { href: '/work/qualification-nissho-bookkeeping2-test', label: '簿記2級に合格した体験談' },
      },
    ],
  },
  {
    title: 'FP（ファイナンシャルプランナー）',
    lead: 'ゼロから独学したときのシリーズ',
    items: [
      {
        id: '1700396158378672',
        name: 'みんなが欲しかった！FPの教科書3級',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0811/9784300120811_1_15.jpg?_ex=400x400',
        note: '税金・保険・年金など、暮らしのお金の話が図でわかりやすいです。私が使ったのは前の年度版です。',
        article: { href: '/work/recommended-texts-for-self-study-for-financial-planners-and-study-methods-to-pass', label: 'FPを独学した記事' },
      },
      {
        id: '1700396158420199',
        name: 'みんなが欲しかった！FPの問題集3級',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0859/9784300120859_1_15.jpg?_ex=400x400',
        note: '「1章読んだらすぐ問題を解く」をくり返して覚えました。',
        article: { href: '/work/recommended-texts-for-self-study-for-financial-planners-and-study-methods-to-pass', label: 'FPを独学した記事' },
      },
      {
        id: '1700396158457715',
        name: 'みんなが欲しかった！FPの教科書2級・AFP',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0828/9784300120828_1_16.jpg?_ex=400x400',
        note: '3級より内容が深くなりますが、3級と同じ作りなので続けて読みやすかったです。',
        article: { href: '/work/recommended-texts-for-self-study-for-financial-planners-and-study-methods-to-pass', label: 'FPを独学した記事' },
      },
      {
        id: '1700396158480263',
        name: 'みんなが欲しかった！FPの問題集2級・AFP',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/book/cabinet/0866/9784300120866_1_16.jpg?_ex=400x400',
        note: '「教科書を1章読む→問題集で確認→最後に過去問」の流れで使いました。',
        article: { href: '/work/recommended-texts-for-self-study-for-financial-planners-and-study-methods-to-pass', label: 'FPを独学した記事' },
      },
    ],
  },
  {
    title: 'おでかけ・ふるさと納税',
    lead: '家族で使って、また選びたい物',
    items: [
      {
        id: '1700395337085235',
        name: 'クロックス バヤバンド クロッグ',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/crocs/cabinet/product/13158907/205089_261004.jpg?_ex=400x400',
        note: '春に買って、ちょっとそこまで親子でほぼ毎日。濡れても拭くだけで、急な雨でも気になりません。',
      },
      {
        id: '1700395337243236',
        name: '【ふるさと納税】和歌山県広川町 完熟有田みかん',
        img: 'https://thumbnail.image.rakuten.co.jp/@0_mall/f303623-hirogawa/cabinet/09781746/imgrc0092972135.jpg?_ex=400x400',
        note: '2024年のふるさと納税で頼みました。冬のおやつに。先行予約で早めに決めておくとラクでした。',
        article: { href: '/money/furusato-nozei-2026', label: 'ふるさと納税2026の記事' },
      },
    ],
  },
]

export default function FavoritesPage() {
  return (
    <div className="container-responsive max-w-4xl mx-auto py-10">
      <p className="text-[11px] font-bold tracking-[0.3em] text-[var(--c-accent-ink)]">ひーちママの愛用品</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900" style={{ textWrap: 'balance' }}>
        実際に使ってよかった物だけ、集めました
      </h1>
      <p className="mt-4 text-gray-700 leading-relaxed">
        ブログで紹介した物を中心に、わが家で今も使っている物だけを並べています。
        くわしい感想や写真は、楽天ROOMにまとめています。値段やセールは変わるので、ボタンの先で確かめてくださいね。
      </p>
      <nav aria-label="もくじ" className="mt-6 flex flex-wrap gap-2">
        {groups.map((g) => (
          <a key={g.title} href={`#${encodeURIComponent(g.title)}`} className="chip-tag">
            {g.title}
          </a>
        ))}
      </nav>

      {groups.map((g) => (
        <section key={g.title} id={encodeURIComponent(g.title)} className="mt-12 scroll-mt-24">
          <h2 className="text-xl font-bold text-gray-900">{g.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{g.lead}</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {g.items.map((it) => (
              <article key={it.id} className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.img}
                  alt={it.name}
                  loading="lazy"
                  className="w-full aspect-square object-contain bg-gray-50 rounded"
                />
                <h3 className="mt-3 font-bold text-gray-900 leading-snug">{it.name}</h3>
                <p className="mt-2 text-[15px] text-gray-700 leading-relaxed flex-1">{it.note}</p>
                {it.article && (
                  <p className="mt-2 text-sm">
                    <Link href={it.article.href} className="underline underline-offset-4 text-[var(--c-primary)]">
                      → {it.article.label}を読む
                    </Link>
                  </p>
                )}
                <AffiliateCtaButton
                  variant="rakuten"
                  href={`${ROOM}/${it.id}`}
                  label="楽天ROOMで見る"
                  big
                  dest="ひーちママの楽天ROOMが開きます"
                />
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-14 text-center">
        <p className="text-gray-700">ほかのおすすめも、楽天ROOMで少しずつ増やしています。</p>
        <AffiliateCtaButton
          variant="rakuten"
          href={ROOM}
          label="楽天ROOMで全部見る"
          big
          dest="ひーちママの楽天ROOMが開きます"
        />
      </section>
    </div>
  )
}
