"use client"

import { useState } from 'react'
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
      { id: 'daily-1', alt: '「ありがとう」スタンプ', src: '/images/stamps/line-stamp-daily-arigatou.png', width: 94, height: 100 },
      { id: 'daily-2', alt: '「ガンバリ」スタンプ', src: '/images/stamps/line-stamp-daily-ganbari.png', width: 256, height: 267 },
      { id: 'daily-3', alt: '「ごめーん」スタンプ', src: '/images/stamps/line-stamp-daily-gomen.png', width: 257, height: 250 }
    ],
    note: '※ 定番フレーズのスタンプから一部サンプルです。'
  },
  {
    key: 'seasonal',
    title: '🧡 季節イベント編',
    description: 'お花見や紅葉、メリークリスマスなど季節のイベント・行事に合わせて使えるメッセージを揃えました。',
    link: 'https://line.me/S/sticker/31853805?_from=lcm',
    buttonLabel: 'LINEスタンプを見る',
    buttonClass: 'bg-[#f19a5b] hover:bg-[#e28949]',
    previews: [
      { id: 'seasonal-1', alt: '「お花見」スタンプ', src: '/images/stamps/line-stamp-seasonal-ohanami.png', width: 210, height: 184 },
      { id: 'seasonal-2', alt: '「メリークリスマス」スタンプ', src: '/images/stamps/line-stamp-seasonal-christmas.png', width: 304, height: 249 },
      { id: 'seasonal-3', alt: '「Happy New Year」スタンプ', src: '/images/stamps/line-stamp-seasonal-newyear.png', width: 334, height: 284 }
    ],
    note: '※ 季節行事のスタンプから抜粋したサンプルです。'
  }
]

export function LineStampPromo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-y border-primary/20 bg-white/80">
      {/* コンパクトバナー（常時表示） */}
      <div className="container-responsive py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-base">🩷</span>
          <span>オリジナルLINEスタンプ販売中</span>
        </div>
        <button
          onClick={() => setOpen(v => !v)}
          className="shrink-0 text-xs px-3 py-1 rounded-full border border-primary/40 text-primary hover:bg-primary/5 transition-colors"
          aria-expanded={open}
        >
          {open ? '閉じる ▲' : '詳しく見る ▼'}
        </button>
      </div>

      {/* 展開パネル */}
      {open && (
        <div className="container-responsive pb-8 pt-2 space-y-6 border-t border-primary/10">
          <div className="grid gap-6 lg:grid-cols-2">
            {promos.map((promo) => (
              <article key={promo.key} className="flex flex-col sm:flex-row gap-4 bg-[#f7fafb] border border-primary/20 rounded-xl p-5">
                <div className="sm:w-2/5 grid grid-cols-3 gap-2 content-start">
                  {promo.previews.map((preview) => (
                    <figure key={preview.id} className="overflow-hidden rounded-lg border border-primary/10 bg-white p-1.5">
                      <Image
                        src={preview.src}
                        alt={preview.alt}
                        width={preview.width}
                        height={preview.height}
                        className="w-full h-auto object-contain"
                        sizes="80px"
                      />
                    </figure>
                  ))}
                  <p className="col-span-3 mt-1 text-xs text-gray-400">{promo.note}</p>
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="font-semibold text-gray-800">{promo.title}</h3>
                  <p className="text-sm text-gray-600 leading-6">{promo.description}</p>
                  <Link
                    href={promo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-medium transition-colors ${promo.buttonClass}`}
                  >
                    {promo.buttonLabel} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
