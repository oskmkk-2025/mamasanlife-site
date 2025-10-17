"use client"
import { useState } from 'react'

type Heading = { id: string; text: string; level: number }

export function FloatingToc({ headings }: { headings: Heading[] }){
  const items = (headings||[]).filter(h => h.level<=2)
  const [open, setOpen] = useState(false)
  if (!items.length) return null
  return (
    <div className="md:hidden">
      {!open && (
        <button
          aria-label="目次を開く"
          onClick={()=>setOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-[var(--c-primary)] text-white text-sm px-3 py-2 rounded-full shadow"
        >目次</button>
      )}
      {open && (
        <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-16 w-[92%] max-w-md bg-white rounded-xl shadow-lg p-4"
               onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">目次</div>
              <button className="text-sm px-2 py-1 rounded-md border" onClick={()=>setOpen(false)}>閉じる</button>
            </div>
            <nav aria-label="目次">
              <ol className="text-sm space-y-2">
                {items.map(h => (
                  <li key={h.id}>
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

