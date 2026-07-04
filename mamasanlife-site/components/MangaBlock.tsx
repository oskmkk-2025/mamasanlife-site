/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { sanityImageRefToUrl } from '@/lib/image-util'

type MangaBlockProps = {
    images: {
        asset: {
            _ref: string
        }
        alt: string
        caption?: string
    }[]
}

// 縦配列のコマ割りマンガ。
// セリフは画像内ではなくキャプション（コマの下）に表示する方式:
// - AI生成画像の日本語文字崩れを回避できる
// - セリフがテキストとして検索エンジン・読み上げにも届く
export function MangaBlock({ images }: MangaBlockProps) {
    if (!images || images.length === 0) return null

    return (
        <div className="manga-block my-10 flex flex-col items-center gap-4" role="group" aria-label="マンガ">
            {images.map((image, idx) => {
                const src = sanityImageRefToUrl(image.asset._ref, { w: 1200, q: 85 })
                return (
                    <figure key={idx} className="w-full max-w-[560px] m-0">
                        <div className="rounded-xl overflow-hidden border-2 border-[var(--c-border)] bg-white leading-[0]">
                            <img
                                src={src}
                                alt={image.alt || `コマ ${idx + 1}`}
                                className="w-full h-auto block m-0 p-0"
                                loading="lazy"
                            />
                        </div>
                        {image.caption && (
                            <figcaption className="mt-1.5 px-1 text-[14px] leading-relaxed text-gray-700 whitespace-pre-line">
                                {image.caption}
                            </figcaption>
                        )}
                    </figure>
                )
            })}
        </div>
    )
}
