"use client"

import { useEffect, useRef } from 'react'

type HtmlEmbedProps = {
  html?: string
}

export function HtmlEmbed({ html = '' }: HtmlEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = containerRef.current
    if (!target) return

    const nextHtml = html || ''
    if (target.innerHTML !== nextHtml) {
      target.innerHTML = nextHtml
    }

    const scripts = Array.from(target.querySelectorAll('script'))
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script')
      for (const attr of Array.from(oldScript.attributes)) {
        newScript.setAttribute(attr.name, attr.value)
      }
      newScript.textContent = oldScript.textContent
      oldScript.replaceWith(newScript)
    })
  }, [html])

  return <div className="embed-html" ref={containerRef} suppressHydrationWarning />
}
