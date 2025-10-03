"use client"
import { useEffect, useRef } from 'react'

export function ViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false)
  useEffect(()=>{
    if (sent.current || !slug) return
    sent.current = true
    // セッション内の重複送信を抑制
    const key = `viewed:${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/trk/view', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug })
    }).catch(()=>{})
  },[slug])
  return null
}

