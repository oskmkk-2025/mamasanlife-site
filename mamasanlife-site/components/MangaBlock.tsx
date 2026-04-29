/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { sanityImageRefToUrl } from '@/lib/image-util'

type MangaBlockProps = {
    images: {
        asset: {
            _ref: string
        }
        alt: string
    }[]
}

export function MangaBlock({ images }: MangaBlockProps) {
    if (!images || images.length === 0) return null

    return (
        <div className="manga-block my-10 flex flex-col items-center">
            {images.map((image, idx) => {
                const src = sanityImageRefToUrl(image.asset._ref, { w: 1200, q: 85 })
                return (
                    <div key={idx} className="w-full max-w-[800px] leading-[0]">
                        <img
                            src={src}
                            alt={image.alt || `コマ ${idx + 1}`}
                            className="w-full h-auto block m-0 p-0"
                            loading="lazy"
                        />
                    </div>
                )
            })}
        </div>
    )
}
