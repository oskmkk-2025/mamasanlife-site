import Link from 'next/link'
import Image from 'next/image'

const promos = [
  {
    key: 'daily',
    title: '🩷 ほっこり日常編',
    description: '「おはよう」「おつかれ」「ありがとう」など、毎日のあいさつやちょっとした気持ちを伝える定番フレーズをたっぷり詰め込みました。',
    link: 'https://line.me/S/sticker/31833710?_from=lcm',
    buttonLabel: 'LINEスタンプを見る',
    buttonClass: 'bg-[#88b6b2] hover:bg-[#78a6a2]',
    previews: [
      {
        id: 'daily-1',
        alt: '「ありがとう」スタンプ',
        src: '/images/stamps/line-stamp-daily-arigatou.png',
        width: 94,
        height: 100
      },
      {
        id: 'daily-2',
        alt: '「ガンバリ」スタンプ',
        src: '/images/stamps/line-stamp-daily-ganbari.png',
        width: 256,
        height: 267
      },
      {
        id: 'daily-3',
        alt: '「ごめーん」スタンプ',
        src: '/images/stamps/line-stamp-daily-gomen.png',
        width: 257,
        height: 250
      }
    ],
    note: '※ 定番フレーズのスタンプからピックアップした一部サンプルです。'
  },
  {
    key: 'seasonal',
    title: '🧡 季節イベント編',
    description: 'お花見や紅葉、メリークリスマスなど季節のイベント・行事に合わせて使えるメッセージを揃えました。家族や友だちとの思い出づくりにどうぞ。',
    link: 'https://line.me/S/sticker/31853805?_from=lcm',
    buttonLabel: 'LINEスタンプを見る',
    buttonClass: 'bg-[#f19a5b] hover:bg-[#e28949]',
    previews: [
      {
        id: 'seasonal-1',
        alt: '「お花見」スタンプ',
        src: '/images/stamps/line-stamp-seasonal-ohanami.png',
        width: 210,
        height: 184
      },
      {
        id: 'seasonal-2',
        alt: '「メリークリスマス」スタンプ',
        src: '/images/stamps/line-stamp-seasonal-christmas.png',
        width: 304,
        height: 249
      },
      {
        id: 'seasonal-3',
        alt: '「Happy New Year」スタンプ',
        src: '/images/stamps/line-stamp-seasonal-newyear.png',
        width: 334,
        height: 284
      }
    ],
    note: '※ 季節行事のスタンプから抜粋したサンプルです。'
  }
]

export function LineStampPromo() {
  return (
    <section className="border-y border-primary/30 bg-white/90">
      <div className="container-responsive py-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-emphasis)]">Original LINE Stickers</p>
          <h2 className="text-3xl font-bold title-display text-emphasis">オリジナルLINEスタンプができました</h2>
          <p className="text-gray-600 leading-7">
            MamasanLife オリジナルのイラストで、毎日の会話や季節のイベントをもっと楽しく。ふだん使い編と季節イベント編の2セットをご用意しました。
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {promos.map((promo) => (
            <article key={promo.key} className="group flex flex-col md:flex-row gap-6 bg-white border border-primary/30 rounded-2xl p-6 shadow-sm hover:shadow transition-shadow duration-200">
              <div className="md:w-1/2 flex flex-col justify-center">
                <div
                  className={`grid gap-3 sm:gap-4 ${
                    promo.previews.length === 2
                      ? 'grid-cols-2'
                      : promo.previews.length === 4
                      ? 'grid-cols-2 md:grid-cols-4'
                      : 'grid-cols-3'
                  }`}
                >
                  {promo.previews.map((preview) => (
                    <figure
                      key={preview.id}
                      className="overflow-hidden rounded-xl border border-primary/20 bg-[#f7faf9] p-2"
                    >
                      <Image
                        src={preview.src}
                        alt={preview.alt}
                        width={preview.width}
                        height={preview.height}
                        className="w-full h-auto object-contain"
                        sizes="(min-width: 768px) 160px, 120px"
                      />
                    </figure>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">{promo.note}</p>
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-semibold text-emphasis">{promo.title}</h3>
                <p className="text-gray-600 leading-7">{promo.description}</p>
                <div>
                  <Link
                    href={promo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold transition-colors duration-200 ${promo.buttonClass}`}
                  >
                    {promo.buttonLabel}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
