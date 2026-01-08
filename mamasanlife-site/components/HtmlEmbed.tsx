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

    // スクリプトの再実行を確実にする
    const scripts = Array.from(target.querySelectorAll('script'))
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value)
      })
      if (oldScript.src) {
        // 外部スクリプトの場合
        newScript.async = true
      } else {
        // インラインスクリプトの場合
        newScript.textContent = oldScript.textContent
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript)
    })
  }, [html])

  return (
    <div className="embed-html" ref={containerRef} suppressHydrationWarning>
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Appreach styling is now handled in globals.css */
      `}} />
    </div>
  )
}
