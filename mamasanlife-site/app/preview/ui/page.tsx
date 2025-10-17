"use client"
import { useEffect, useMemo, useRef, useState } from 'react'

type Preset = { label: string; width: number }
const SP_PRESETS: Preset[] = [
  { label: '360', width: 360 },
  { label: '390', width: 390 },
  { label: '414', width: 414 },
  { label: '430', width: 430 }
]
const PC_PRESETS: Preset[] = [
  { label: '1024', width: 1024 },
  { label: '1280', width: 1280 },
  { label: '1440', width: 1440 }
]

export default function DesignPreviewUI(){
  const [path, setPath] = useState('/money/smartphone-for-junior-high-school-students')
  const [spW, setSpW] = useState(390)
  const [pcW, setPcW] = useState(1280)
  const spRef = useRef<HTMLIFrameElement|null>(null)
  const pcRef = useRef<HTMLIFrameElement|null>(null)
  const [autoScroll, setAutoScroll] = useState(false)
  const [autoFitHeight, setAutoFitHeight] = useState(true)
  const [autoFitScale, setAutoFitScale] = useState(true)
  const scrollTimer = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement|null>(null)
  const [scaleSp, setScaleSp] = useState(1)
  const [scalePc, setScalePc] = useState(1)
  const [spH, setSpH] = useState<number>(800)
  const [pcH, setPcH] = useState<number>(800)

  const urlSp = useMemo(()=> `${path}?_pv=sp-${spW}`, [path, spW])
  const urlPc = useMemo(()=> `${path}?_pv=pc-${pcW}`, [path, pcW])

  useEffect(()=>{
    try{
      const saved = localStorage.getItem('previewPath')
      if (saved) setPath(saved)
    }catch{}
  },[])

  useEffect(()=>{
    try{ localStorage.setItem('previewPath', path) }catch{}
  },[path])

  useEffect(()=>{
    if (!autoScroll){ if (scrollTimer.current) clearInterval(scrollTimer.current); return }
    const tick = ()=>{
      for (const iframe of [spRef.current, pcRef.current]){
        const w = iframe?.contentWindow
        if (!w) continue
        try{
          const y = w.scrollY
          w.scrollTo({ top: y + 1, behavior: 'auto' })
          const max = w.document.body.scrollHeight - w.innerHeight
          if (y >= max - 2) w.scrollTo({ top: 0 })
        }catch{}
      }
    }
    scrollTimer.current = setInterval(tick, 16)
    return ()=>{ if (scrollTimer.current) clearInterval(scrollTimer.current) }
  },[autoScroll])

  // Auto-fit iframe height to its document height (same-origin)
  useEffect(()=>{
    if (!autoFitHeight) return
    const frames = [spRef.current, pcRef.current].filter(Boolean) as HTMLIFrameElement[]
    const observers: ResizeObserver[] = []
    const attach = (iframe: HTMLIFrameElement)=>{
      const fit = ()=>{
        try{
          const doc = iframe.contentDocument
          if (!doc) return
          const h = Math.max(
            doc.body?.scrollHeight || 0,
            doc.documentElement?.scrollHeight || 0
          )
          if (h) iframe.style.height = `${h}px`
          if (iframe === spRef.current && h) setSpH(h)
          if (iframe === pcRef.current && h) setPcH(h)
        }catch{}
      }
      iframe.addEventListener('load', fit)
      // Observe size changes inside the iframe
      try{
        const doc = iframe.contentDocument
        if (doc){
          const ro = new ResizeObserver(fit)
          ro.observe(doc.documentElement)
          ro.observe(doc.body)
          observers.push(ro)
          // initial
          setTimeout(fit, 50)
        }
      }catch{}
    }
    frames.forEach(attach)
    return ()=>{
      observers.forEach(o=>o.disconnect())
    }
  },[autoFitHeight, urlSp, urlPc])

  // Auto-fit scale so frames never overflow container
  useEffect(()=>{
    if (!autoFitScale) { setScaleSp(1); setScalePc(1); return }
    const measure = ()=>{
      const box = containerRef.current
      if (!box) return
      const W = box.clientWidth
      // Assume 2 columns when container width is large enough
      const twoCols = W >= 1100
      const gap = 24 // Tailwind gap-6 ~ 24px
      if (twoCols){
        const colW = (W - gap) / 2
        setScaleSp(Math.min(1, colW / spW))
        setScalePc(Math.min(1, colW / pcW))
      } else {
        // Single column: fit each to container width
        setScaleSp(Math.min(1, W / spW))
        setScalePc(Math.min(1, W / pcW))
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return ()=>{ window.removeEventListener('resize', measure); ro.disconnect() }
  },[autoFitScale, spW, pcW])

  const startRecording = async ()=>{
    try{
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
      const chunks: BlobPart[] = []
      mr.ondataavailable = (e)=>{ if (e.data?.size) chunks.push(e.data) }
      mr.onstop = ()=>{
        const blob = new Blob(chunks, { type: 'video/webm' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'preview.webm'
        a.click()
      }
      mr.start()
      alert('録画を開始しました。停止はブラウザの共有UIで停止してください。')
    }catch(e:any){ alert('録画を開始できません: ' + (e?.message||'unknown')) }
  }

  return (
    <div className="container-responsive py-6" ref={containerRef}>
      <h1 className="text-2xl font-semibold mb-4">Design Preview (PC / SP)</h1>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm">Path
          <input value={path} onChange={e=>setPath(e.target.value)} className="border ml-2 px-2 py-1 rounded w-[380px] max-w-[80vw]" placeholder="/category/slug" />
        </label>
        <div className="text-sm">SP:
          {SP_PRESETS.map(p=> (
            <button key={p.label} onClick={()=>setSpW(p.width)} className={`ml-2 px-2 py-1 rounded border ${spW===p.width? 'bg-[var(--c-primary)] text-white':'bg-white'}`}>{p.label}</button>
          ))}
        </div>
        <div className="text-sm">PC:
          {PC_PRESETS.map(p=> (
            <button key={p.label} onClick={()=>setPcW(p.width)} className={`ml-2 px-2 py-1 rounded border ${pcW===p.width? 'bg-[var(--c-primary)] text-white':'bg-white'}`}>{p.label}</button>
          ))}
        </div>
        <button onClick={()=>setAutoScroll(v=>!v)} className="px-3 py-1 rounded border text-sm">{autoScroll? 'Auto Scroll: ON':'Auto Scroll: OFF'}</button>
        <button onClick={()=>setAutoFitHeight(v=>!v)} className="px-3 py-1 rounded border text-sm">{autoFitHeight? 'Auto Fit Height: ON':'Auto Fit Height: OFF'}</button>
        <button onClick={startRecording} className="px-3 py-1 rounded border text-sm">画面録画（WebM）</button>
        <button onClick={()=>setAutoFitScale(v=>!v)} className="px-3 py-1 rounded border text-sm">{autoFitScale? 'Fit to View: ON':'Fit to View: OFF'}</button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div>
          <div className="text-sm text-gray-600 mb-2">SP {spW}px {autoFitScale && scaleSp<1 ? `(scaled x${scaleSp.toFixed(2)})` : ''}</div>
          <div className="mx-auto border rounded-md bg-white shadow-md overflow-hidden" style={{ width: Math.round(spW * (autoFitScale? scaleSp:1)), height: Math.round((autoFitHeight? spH:800) * (autoFitScale? scaleSp:1)) }}>
            <iframe ref={spRef} src={urlSp} title="sp" style={{ width: spW, height: autoFitHeight? spH : 800, border: '0', display:'block', transform: `scale(${autoFitScale? scaleSp:1})`, transformOrigin: 'top left' }} />
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-2">PC {pcW}px {autoFitScale && scalePc<1 ? `(scaled x${scalePc.toFixed(2)})` : ''}</div>
          <div className="mx-auto border rounded-md bg-white shadow-md overflow-hidden" style={{ width: Math.round(pcW * (autoFitScale? scalePc:1)), height: Math.round((autoFitHeight? pcH:800) * (autoFitScale? scalePc:1)) }}>
            <iframe ref={pcRef} src={urlPc} title="pc" style={{ width: pcW, height: autoFitHeight? pcH : 800, border: '0', display:'block', transform: `scale(${autoFitScale? scalePc:1})`, transformOrigin: 'top left' }} />
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4">録画はブラウザの画面共有UIから停止してください（ダウンロードが自動開始）。</p>
    </div>
  )
}
