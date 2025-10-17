"use client"
import React, { useEffect, useRef, useState } from 'react'

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

  return (
    <div className={`my-5 flex ${alignRight ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[720px] w-full flex items-start gap-4 ${alignRight ? 'flex-row-reverse' : ''}`}>
        <div className={`flex flex-col items-center justify-start shrink-0 ${alignRight ? 'ml-2' : 'mr-2'}`} style={{ minHeight: iconSize }}>
          {value?.iconUrl && (
            <img src={String(value.iconUrl)} alt={value?.name||''}
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
