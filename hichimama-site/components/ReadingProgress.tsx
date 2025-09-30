"use client"
import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const height = document.body.scrollHeight - window.innerHeight
      const p = height > 0 ? Math.min(100, Math.max(0, (scrolled / height) * 100)) : 0
      setProgress(p)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return (
    <div aria-hidden className="fixed top-0 left-0 right-0 z-[60] h-1 bg-brand-100">
      <div className="h-full bg-brand-600 transition-[width] duration-150" style={{ width: `${progress}%` }} />
    </div>
  )
}

