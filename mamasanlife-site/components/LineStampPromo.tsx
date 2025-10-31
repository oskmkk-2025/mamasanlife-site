import Link from 'next/link'
import Image from 'next/image'

const promos = [
  {
    key: 'daily',
    title: '🩷 ほっこり日常編',
    description: '「おはよう」「おつかれ」「ありがとう」など、毎日のあいさつやちょっとした気持ちを伝える定番フレーズをたっぷり詰め込みました。',
    image: '/images/line-stamp-school.png',
    link: 'https://line.me/S/sticker/31833710?_from=lcm',
    buttonLabel: 'LINEスタンプを見る',
    buttonClass: 'bg-[#88b6b2] hover:bg-[#78a6a2]'
  },
  {
    key: 'seasonal',
    title: '🧡 季節イベント編',
    description: 'お花見や紅葉、メリークリスマスなど季節のイベント・行事に合わせて使えるメッセージを揃えました。家族や友だちとの思い出づくりにどうぞ。',
    image: '/images/line-stamp-seasonal.png',
    link: 'https://line.me/S/sticker/31853805?_from=lcm',
    buttonLabel: 'LINEスタンプを見る',
    buttonClass: 'bg-[#f19a5b] hover:bg-[#e28949]'
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
            <article key={promo.key} className="flex flex-col md:flex-row gap-6 bg-white border border-primary/30 rounded-2xl p-6 shadow-sm hover:shadow transition-shadow duration-200">
              <div className="md:w-1/2">
                <div className="overflow-hidden rounded-xl bg-[#f7faf9] border border-primary/20">
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    width={590}
                    height={1260}
                    className="w-full h-full object-contain"
                  />
                </div>
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
