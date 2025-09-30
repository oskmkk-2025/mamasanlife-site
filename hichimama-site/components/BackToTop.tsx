"use client"
import { useEffect, useState } from 'react'

export function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 200)
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!show) return null
  return (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 p-0 bg-transparent"
      style={{ color: '#B1B4AB' }}
    >
      <i className="fa fa-arrow-circle-up" style={{ fontSize: 40 }} />
    </button>
  )
}
