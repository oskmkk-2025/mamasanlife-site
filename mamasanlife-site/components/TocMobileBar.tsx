"use client"
import { useState, useEffect } from 'react'

type Heading = { id: string; text: string; level: number }

export function TocMobileBar({ headings }: { headings: Heading[] }){
  const [open, setOpen] = useState(false)
  useEffect(()=>{
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  },[open])
  const items = (headings || []).filter(h => h.level<=3)
  if (!items.length) return null
  return (
    <div className="md:hidden sticky top-[104px] z-30">
      <div className="bg-white/95 backdrop-blur border-b border-primary px-3 py-2 flex items-center justify-between">
        <div className="text-sm font-semibold">目次</div>
        <button className="text-sm px-3 py-1 rounded-md border focus-ring" onClick={()=>setOpen(true)}>開く</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={()=>setOpen(false)}>
          <div className="absolute left-0 right-0 top-[20%] mx-auto max-w-md bg-white rounded-lg shadow-lg p-4" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">目次</div>
              <button className="text-sm px-2 py-1 rounded-md border focus-ring" onClick={()=>setOpen(false)}>閉じる</button>
            </div>
            <nav aria-label="目次">
              <ol className="text-sm space-y-2">
                {items.map((h)=> (
                  <li key={h.id} className={h.level===3? 'pl-4' : ''}>
                    <a href={`#${h.id}`} onClick={()=>setOpen(false)} className="underline underline-offset-2">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

