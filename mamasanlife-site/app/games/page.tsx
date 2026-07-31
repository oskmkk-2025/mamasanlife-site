import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 3600

export const metadata = {
  title: 'お金が学べる無料ゲーム｜ひーちfamilyのゲームひろば',
  description:
    'ひーちママが作った、子どものお金の勉強になる無料ゲーム。コインを合体させる「コインもりもり」、ぴったり払いに挑戦する「レジぴったん」。インストール不要、スマホでそのまま遊べます。',
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'お金が学べる無料ゲーム｜ひーちfamilyのゲームひろば',
    description: 'インストール不要・無料。遊ぶだけでお金の計算が身につく知育ゲームで遊べます。',
    images: ['/images/games/coin-morimori.jpg'],
  },
}

const games = [
  {
    key: 'coin-morimori',
    emoji: '🐷',
    title: 'コインもりもり',
    catch: 'コインを合体させて金の貯金箱ブタを育てよう',
    learn: 'お金の単位と両替（1円×5まい＝5円）',
    target: '年中〜小学生',
    description:
      '同じお金を「ほんとうの値段のまい数」だけくっつけると、次のお金に両替されます。1円が5まいで5円、5円が2まいで10円…と、実際のお金と同じ計算だから、遊んでいるうちに自然と単位のしくみが身につきます。貯まったお金でごほうびがもらえるので、目標に向かってコツコツ貯める感覚も味わえます。',
    href: 'https://coin-morimori.vercel.app/',
    image: '/images/games/coin-morimori.jpg',
    accent: 'from-amber-50 to-orange-50 border-orange-200',
    button: 'bg-[#f5a623] hover:bg-[#e0951c]',
  },
  {
    key: 'reji-pittan',
    emoji: '🛒',
    title: 'レジぴったん',
    catch: 'お店やさんになって「ぴったり払い」に挑戦',
    learn: 'たし算・ひき算・おつりの計算',
    target: '小学生〜大人',
    description:
      '品物のねだんと同じ金額になるように、コインを選んでお会計。少ないまい数で払えると「スマート払いボーナス」がもらえます。上級の「たつじん」モードでは、1000円札を受け取っておつりを渡す側に。ひき算の暗算練習になり、大人がやっても手に汗にぎります。',
    href: 'https://reji-pittan.vercel.app/',
    image: '/images/games/reji-pittan.jpg',
    accent: 'from-yellow-50 to-lime-50 border-lime-200',
    button: 'bg-[#f0703d] hover:bg-[#dd5f2d]',
  },
]

export default function GamesPage() {
  return (
    <div className="container-responsive py-10 space-y-10">
      <header className="space-y-3 text-center">
        <h1 className="text-2xl font-semibold">🎮 ひーちfamilyのゲームひろば</h1>
        <p className="text-sm text-gray-600 leading-7 max-w-2xl mx-auto">
          「遊びながらお金の計算を覚えてほしい」と思って作った、オリジナルの無料ゲームです。
          アプリのインストールは必要ありません。スマホでもパソコンでも、下のボタンからそのまま遊べます。
          広告も課金もありません。
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {games.map((game) => (
          <article
            key={game.key}
            className={`rounded-2xl border bg-gradient-to-b ${game.accent} overflow-hidden flex flex-col`}
          >
            <Link href={game.href} target="_blank" rel="noopener noreferrer" className="block">
              <Image
                src={game.image}
                alt={`${game.title}の画面`}
                width={1200}
                height={630}
                className="w-full h-auto"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </Link>
            <div className="p-6 space-y-4 flex-1 flex flex-col">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {game.emoji} {game.title}
                </h2>
                <p className="text-sm font-medium text-gray-600">{game.catch}</p>
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm text-gray-700">
                <dt className="font-semibold text-gray-500">学べること</dt>
                <dd>{game.learn}</dd>
                <dt className="font-semibold text-gray-500">対象</dt>
                <dd>{game.target}</dd>
                <dt className="font-semibold text-gray-500">料金</dt>
                <dd>無料（インストール不要）</dd>
              </dl>

              <p className="text-sm text-gray-600 leading-7 flex-1">{game.description}</p>

              <Link
                href={game.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full text-white font-bold transition-colors ${game.button}`}
              >
                {game.title}であそぶ →
              </Link>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-primary/20 bg-white/80 p-6 space-y-3">
        <h2 className="font-semibold text-gray-800">🐱 キャラクターについて</h2>
        <p className="text-sm text-gray-600 leading-7">
          ゲームに登場するねこ耳の家族「ひーちfamily」は、このブログの4コマまんがのキャラクターです。
          LINEスタンプも販売中なので、よかったらそちらものぞいてみてください。
        </p>
        <Link
          href="https://store.line.me/stickershop/author/5712335/ja"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#06c755] hover:bg-[#05b34c] text-white text-sm font-medium transition-colors"
        >
          LINEスタンプを見る →
        </Link>
      </section>
    </div>
  )
}
