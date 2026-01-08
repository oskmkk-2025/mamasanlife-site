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
          align-items: flex-start !important;
          gap: 16px !important;
          border: 1px solid #ccc !important;
          padding: 16px !important;
          border-radius: 8px !important;
          background: #fff !important;
          width: 100% !important;
          max-width: 600px !important;
          margin: 1.5rem 0 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
          box-sizing: border-box !important;
          font-family: sans-serif !important;
        }
        @media (max-width: 480px) {
          .embed-html #appreach-box, .embed-html .appreach, .embed-html .appreach-box {
            padding: 12px !important;
            gap: 12px !important;
          }
        }
        .embed-html #appreach-image, .embed-html .appreach__icon, .embed-html .appreach-image {
          width: 80px !important;
          height: 80px !important;
          flex-shrink: 0 !important;
          margin: 0 !important;
          border-radius: 18px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        @media (min-width: 600px) {
          .embed-html #appreach-image, .embed-html .appreach__icon, .embed-html .appreach-image {
            width: 100px !important;
            height: 100px !important;
            border-radius: 22px !important;
          }
        }
        .embed-html #appreach-image img, .embed-html .appreach__icon img, .embed-html .appreach-image img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
          margin: 0 !important;
        }
        .embed-html .appreach-info, .embed-html .appreach__detail, .embed-html .appreach-detail {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-width: 0 !important;
          margin: 0 !important;
        }
        .embed-html .appreach-name, .embed-html .appreach__name {
          font-size: 16px !important;
          font-weight: bold !important;
          margin: 0 0 6px !important;
          line-height: 1.4 !important;
          color: #333 !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
        }
        @media (min-width: 600px) {
          .embed-html .appreach-name, .embed-html .appreach__name {
            font-size: 18px !important;
          }
        }
        .embed-html .appreach-developer, .embed-html .appreach-price, .embed-html .appreach__info, .embed-html .appreach-info p {
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          gap: 8px !important;
          font-size: 12px !important;
          color: #666 !important;
          margin: 0 0 12px !important;
        }
        .embed-html .appreach-links, .embed-html .appreach__links {
          display: flex !important;
          gap: 8px !important;
          margin-top: auto !important;
          flex-wrap: wrap !important;
        }
        .embed-html .appreach-links img, .embed-html .appreach__links img,
        .embed-html .appreach__aslink img, .embed-html .appreach__gplink img {
          height: 34px !important;
          width: auto !important;
          display: block !important;
        }
        @media (min-width: 600px) {
          .embed-html .appreach-links img, .embed-html .appreach__links img,
          .embed-html .appreach__aslink img, .embed-html .appreach__gplink img {
            height: 40px !important;
          }
        }
      `}} />
    </div>
  )
}
