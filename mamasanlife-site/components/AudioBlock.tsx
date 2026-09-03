"use client"

import React, { useRef, useState } from 'react'
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

// GA4へ送る。gtagが無い環境（開発中など）では何もしない
function track(event: string, params: Record<string, unknown>) {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    if (!w.gtag) return
    w.gtag('event', event, { ...params, page_path: location.pathname })
}

export function AudioBlock({ audioFile, title, transcription }: AudioBlockProps) {
    const [isOpen, setIsOpen] = useState(false)
    const audioUrl = sanityFileRefToUrl(audioFile.asset._ref)

    // 1回の表示につき1度だけ送るための記録
    const played = useRef(false)
    const milestones = useRef<Set<number>>(new Set())
    const transcriptOpened = useRef(false)

    if (!audioUrl) return null

    const label = title || '音声'

    // 再生ボタンが押された（最初の1回だけ）
    const onPlay = () => {
        if (played.current) return
        played.current = true
        track('audio_play', { audio_title: label })
    }

    // どこまで聴かれたか。25/50/75/100%の通過時に1度ずつ
    const onTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const el = e.currentTarget
        if (!el.duration || !isFinite(el.duration)) return
        const pct = (el.currentTime / el.duration) * 100
        for (const m of [25, 50, 75]) {
            if (pct >= m && !milestones.current.has(m)) {
                milestones.current.add(m)
                track('audio_progress', { audio_title: label, percent: m })
            }
        }
    }

    const onEnded = () => {
        if (milestones.current.has(100)) return
        milestones.current.add(100)
        track('audio_progress', { audio_title: label, percent: 100 })
    }

    const toggleTranscript = () => {
        const next = !isOpen
        setIsOpen(next)
        if (next && !transcriptOpened.current) {
            transcriptOpened.current = true
            track('audio_transcript_open', { audio_title: label })
        }
    }

    return (
        <div className="audio-block my-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
            {title && <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-xl">🎧</span> {title}
            </h3>}

            <div className="mb-4">
                <audio
                    src={audioUrl}
                    controls
                    preload="metadata"
                    className="w-full h-10 outline-none"
                    onPlay={onPlay}
                    onTimeUpdate={onTimeUpdate}
                    onEnded={onEnded}
                />
            </div>

            {transcription && (
                <div className="transcription-container border-t border-gray-200 pt-4">
                    <button
                        onClick={toggleTranscript}
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
