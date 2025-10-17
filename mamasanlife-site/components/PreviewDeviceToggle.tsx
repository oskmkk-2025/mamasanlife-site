"use client"
import { useEffect, useState } from 'react'

type Mode = 'auto' | 'pc' | 'sp'

export function PreviewDeviceToggle(){
  const [mode, setMode] = useState<Mode>('auto')

  useEffect(()=>{
    const saved = (typeof window !== 'undefined' && window.localStorage.getItem('devPreviewDevice')) as Mode | null
    if (saved) setMode(saved)
  },[])

  useEffect(()=>{
    if (typeof document === 'undefined') return
    const body = document.body
    body.classList.remove('dev-preview-sp','dev-preview-pc')
    if (mode === 'sp') body.classList.add('dev-preview-sp')
    if (mode === 'pc') body.classList.add('dev-preview-pc')
    try{ localStorage.setItem('devPreviewDevice', mode) }catch{}
  },[mode])

  return (
    <div className="dev-toggle">
      <button className={`btn ${mode==='auto'? 'is-active':''}`} onClick={()=>setMode('auto')} aria-pressed={mode==='auto'}>Auto</button>
      <button className={`btn ${mode==='pc'? 'is-active':''}`} onClick={()=>setMode('pc')} aria-pressed={mode==='pc'}>PC</button>
      <button className={`btn ${mode==='sp'? 'is-active':''}`} onClick={()=>setMode('sp')} aria-pressed={mode==='sp'}>SP</button>
    </div>
  )
}

export function DevViewport({ children }: { children: React.ReactNode }){
  return <div className="dev-viewport-wrap">{children}</div>
}

