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
        .embed-html #appreach-box, .embed-html .appreach, .embed-html .appreach-box {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          flex-wrap: nowrap !important;
          gap: 12px !important;
          border: 1px solid #eee !important;
          padding: 8px 12px !important;
          border-radius: 12px !important;
          background: #fff !important;
          width: fit-content !important;
          min-width: 300px !important;
          max-width: 100% !important;
          margin: 1.5rem 0 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
          box-sizing: border-box !important;
        }
        .embed-html #appreach-image, .embed-html .appreach__icon, .embed-html .appreach-image {
          width: 54px !important;
          height: 54px !important;
          flex-shrink: 0 !important;
          margin: 0 !important;
          overflow: hidden !important;
          border-radius: 10px !important;
        }
        .embed-html #appreach-image img, .embed-html .appreach__icon img, .embed-html .appreach-image img {
          width: 54px !important;
          height: 54px !important;
          border-radius: 10px !important;
          object-fit: cover !important;
          display: block !important;
          margin: 0 !important;
        }
        .embed-html .appreach-info, .embed-html .appreach__detail, .embed-html .appreach-detail {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          flex: 1 !important;
          min-width: 0 !important;
          margin: 0 0 0 12px !important;
        }
        .embed-html .appreach-name, .embed-html .appreach__name {
          font-size: 14px !important;
          font-weight: bold !important;
          margin: 0 0 4px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          line-height: 1.2 !important;
        }
        .embed-html .appreach-developer, .embed-html .appreach-price, .embed-html .appreach__info, .embed-html .appreach-info p {
          display: none !important;
        }
        .embed-html .appreach-links, .embed-html .appreach__links {
          display: flex !important;
          gap: 6px !important;
          flex-shrink: 0 !important;
          margin-left: auto !important;
        }
        .embed-html .appreach-links img, .embed-html .appreach__links img {
          height: 32px !important;
          width: auto !important;
          display: block !important;
        }
      `}} />
    </div>
  )
}
