"use client"
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react'

const SPEECH_ICON_MAP: Record<string, string> = {
  'img_69ad0d2f343e-1-2.jpeg': '/images/speech-icons/IMG_69AD0D2F343E-1-2.jpeg',
  'cropped-img_69ad0d2f343e-1-2-300x300.jpeg': '/images/speech-icons/cropped-IMG_69AD0D2F343E-1-2-300x300.jpeg',
  'c204902d-b54f-43b3-b6df-88b08c9aebf6-e1668691519166.png': '/images/speech-icons/C204902D-B54F-43B3-B6DF-88B08C9AEBF6-e1668691519166.png',
  'bb011f9f-4f89-4229-944d-c474c0fad557-e1668692285329.png': '/images/speech-icons/BB011F9F-4F89-4229-944D-C474C0FAD557-e1668692285329.png',
  'woman.png': '/images/speech-icons/woman.png',
  'man.png': '/images/speech-icons/man.png'
}

function resolveSpeechIcon(url?: string) {
  if (!url) return undefined
  try {
    const decoded = decodeURIComponent(url).split('?')[0]
    const file = decoded.split('/').pop()
    if (file) {
      const key = file.toLowerCase()
      if (SPEECH_ICON_MAP[key]) return SPEECH_ICON_MAP[key]
    }
  } catch {
    // ignore decode issues
  }
  return url
}

export function SpeechBlockView({ value }: { value: any }){
  const alignRight = value?.align === 'right'
  const bubbleRef = useRef<HTMLDivElement|null>(null)
  const [iconSize, setIconSize] = useState(80)

  useEffect(()=>{
    const el = bubbleRef.current
    if (!el) return
    const h = el.getBoundingClientRect().height
    // 自動調整: 吹き出しの高さに応じて 64〜96px の範囲で調整（既定80）
    const size = Math.max(64, Math.min(96, Math.round(h)))
    setIconSize(size)
  },[value?.paras])

  const iconSrc = resolveSpeechIcon(value?.iconUrl)
  return (
    <div className={`my-5 flex ${alignRight ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[720px] w-full flex items-start gap-4 ${alignRight ? 'flex-row-reverse' : ''}`}>
        <div className={`flex flex-col items-center justify-start shrink-0 ${alignRight ? 'ml-2' : 'mr-2'}`} style={{ minHeight: iconSize }}>
          {iconSrc && (
            <img src={String(iconSrc)} alt={value?.name||''}
                 width={iconSize} height={iconSize}
                 className="rounded-full overflow-hidden object-cover border shadow-sm"
                 style={{ width: iconSize, height: iconSize }} />
          )}
          {value?.name && <div className="text-[11px] text-gray-600 mt-0 text-center leading-none max-w-[120px]">{value.name}</div>}
        </div>
        <div ref={bubbleRef} className="min-w-0">
          <div className={`relative px-4 py-3 rounded-2xl text-[15px] leading-relaxed`} style={{ background:'#fff', border:'1px solid var(--c-primary)' }}>
            {(value?.paras||[]).map((t:string, i:number)=> (<p key={i} className="mb-2 last:mb-0">{t}</p>))}
            <span className={`absolute top-3 ${alignRight ? 'right-[-8px]' : 'left-[-8px]'} w-0 h-0 border-y-8 border-y-transparent ${alignRight ? 'border-l-8 border-l-[var(--c-primary)]' : 'border-r-8 border-r-[var(--c-primary)]'}`}></span>
          </div>
        </div>
      </div>
    </div>
  )
}
