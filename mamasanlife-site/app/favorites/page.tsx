import Link from 'next/link'
import AffiliateCtaButton from '@/components/AffiliateCtaButton'

// ひーちママの愛用品（楽天ROOMへの入口）。2026-10-08 本人「楽天ROOMへ誘導するページを作って」
// ⚠️載せるのは、本人が実際に使っていて楽天ROOMに投稿している物だけ（一言は本人のROOMの紹介文から）。
// ⚠️セールの値段・〇%OFF・期限は書かない（すぐ古くなって嘘になるため）。値段はリンク先で確認してもらう。
export const metadata = {
  title: 'ひーちママの愛用品｜実際に使ってよかった物だけ',
  description:
    'FP2級ママのひーちママが、実際に使ってよかった物だけを集めました。猫のケージ、黒カビ取り、ドライヤー、簿記の教科書など。くわしい感想は楽天ROOMで紹介しています。',
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
        img: 'https://room.r10s.jp/d/strg/ctrl/22/50a92ca0434cdb52b27b0fbb4a6601b71a550ddf.82.9.22.3.jpg',
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
        img: 'https://room.r10s.jp/d/strg/ctrl/22/384e1141dd7124e2b926aa4a57410f7526c4236b.82.9.22.3.jpg',
        note: '約310gと軽くて腕が疲れない。熱くないのにすぐ乾くので、お風呂上がりのドライヤー時間がラクになりました。',
      },
      {
        id: '1700393489878539',
        name: 'こするだけのナノガラス除毛',
        img: 'https://shop.r10s.jp/kotakasi0217/cabinet/12165513/13512204/imgrc0106449101.jpg',
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
        img: 'https://shop.r10s.jp/cat-land/cabinet/eigyou/i332157.jpg',
        note: 'ねこを迎えたときに買いました。女性1人でも組み立てられて、広くて掃除しやすいのでおすすめです。',
        article: { href: '/feature/protection-cat', label: '保護猫譲渡会の記事' },
      },
    ],
  },
  {
    title: '資格の勉強',
    lead: '日商簿記2級に合格したときの教科書',
    items: [
      {
        id: '1700395731473420',
        name: 'みんなが欲しかった！簿記の教科書 日商2級（商業簿記・工業簿記）',
        img: 'https://shop.r10s.jp/book/cabinet/0675/9784300120675_1_49.jpg',
        note: '図が多くて、独学でも読み進めやすかったシリーズ。私が使ったのは前の版です。商業と工業、問題集をセットで。',
        article: { href: '/work/qualification-nissho-bookkeeping2-test', label: '簿記2級に合格した体験談' },
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
        img: 'https://shop.r10s.jp/crocs/cabinet/product/13158907/205089_261004.jpg',
        note: '春に買って、ちょっとそこまで親子でほぼ毎日。濡れても拭くだけで、急な雨でも気になりません。',
      },
      {
        id: '1700395337243236',
        name: '【ふるさと納税】和歌山県広川町 完熟有田みかん',
        img: 'https://shop.r10s.jp/f303623-hirogawa/cabinet/09781746/imgrc0092972135.jpg',
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
