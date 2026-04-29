"use client"

import React, { useState } from 'react'
import { sanityFileRefToUrl } from '@/lib/image-util'

type AudioBlockProps = {
    audioFile: {
        asset: {
            _ref: string
        }
    }
    title?: string
    transcription?: string
}

export function AudioBlock({ audioFile, title, transcription }: AudioBlockProps) {
    const [isOpen, setIsOpen] = useState(false)
    const audioUrl = sanityFileRefToUrl(audioFile.asset._ref)

    if (!audioUrl) return null

    return (
        <div className="audio-block my-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
            {title && <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-xl">🎧</span> {title}
            </h3>}

            <div className="mb-4">
                <audio src={audioUrl} controls className="w-full h-10 outline-none" />
            </div>

            {transcription && (
                <div className="transcription-container border-t border-gray-200 pt-4">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center justify-between w-full text-sm font-medium text-gray-600 hover:text-[var(--c-primary)] transition-colors focus:outline-none"
                    >
                        <span className="flex items-center gap-2">
                            <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                            文字起こしテキストを確認する
                        </span>
                    </button>

                    {isOpen && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-100 text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 duration-300">
                            {transcription}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
