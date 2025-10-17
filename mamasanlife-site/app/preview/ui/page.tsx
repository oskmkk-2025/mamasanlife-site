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
  const scrollTimer = useRef<any>(null)

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
    <div className="container-responsive py-6">
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
        <button onClick={startRecording} className="px-3 py-1 rounded border text-sm">画面録画（WebM）</button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div>
          <div className="text-sm text-gray-600 mb-2">SP {spW}px</div>
          <div className="mx-auto border rounded-md overflow-hidden bg-white shadow-md" style={{ width: spW }}>
            <iframe ref={spRef} src={urlSp} title="sp" style={{ width: spW, height: 800, border: '0' }} />
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-2">PC {pcW}px</div>
          <div className="mx-auto border rounded-md overflow-hidden bg-white shadow-md" style={{ width: pcW }}>
            <iframe ref={pcRef} src={urlPc} title="pc" style={{ width: pcW, height: 800, border: '0' }} />
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-4">録画はブラウザの画面共有UIから停止してください（ダウンロードが自動開始）。</p>
    </div>
  )
}

