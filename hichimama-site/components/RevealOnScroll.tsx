"use client"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function RevealOnScroll() {
  const pathname = usePathname()
  useEffect(() => {
    document.body.classList.add('reveal-init')
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('revealed'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          io.unobserve(el)
        }
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [pathname])
  return null
}
