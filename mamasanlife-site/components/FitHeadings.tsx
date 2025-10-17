"use client"
import { useEffect } from 'react'

function debounce<T extends (...args:any[])=>void>(fn:T, ms:number){
  let t: any
  return (...args:any[])=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms) }
}

export function FitHeadings(){
  useEffect(()=>{
    const selectors = [
      'h1.title-display',
      '.prose-content h1',
      '.prose-content h2',
      '.prose-content h3',
      '.prose-content h4',
      '.prose-content h5',
      '.prose-content h6'
    ]
    const minMap: Record<string, number> = {
      H1: 14, H2: 13, H3: 12, H4: 11, H5: 10, H6: 10
    }
    const step = 0.5 // px
    const fitAll = () => {
      const vw = window.innerWidth
      const targets = document.querySelectorAll<HTMLElement>(selectors.join(','))
      targets.forEach(el => {
        const tag = el.tagName as keyof typeof minMap
        const minPx = minMap[tag] || 12
        // restore base size on wider screens
        const base = el.dataset.fitBase
        if (vw > 360 && base){ el.style.fontSize = base; return }
        // store base on first run
        if (!base){
          const cs = window.getComputedStyle(el)
          el.dataset.fitBase = cs.fontSize
        }
        // start from current (or base) and shrink until it fits in one line
        const cs = window.getComputedStyle(el)
        let currentPx = parseFloat(cs.fontSize)
        // Ensure single-line and no ellipsis
        el.style.whiteSpace = 'nowrap'
        el.style.textOverflow = 'clip'
        el.style.overflow = 'visible'
        // If it already fits, skip
        if (el.scrollWidth <= el.clientWidth) return
        while (currentPx > minPx && el.scrollWidth > el.clientWidth){
          currentPx = currentPx - step
          el.style.fontSize = currentPx + 'px'
        }
      })
    }
    const onResize = debounce(fitAll, 50)
    fitAll()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return ()=>{
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  },[])
  return null
}

