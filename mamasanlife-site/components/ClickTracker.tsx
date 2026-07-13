'use client'
// 外部リンク（アフィリエイト・LINEスタンプ等）のクリックをGA4イベントとして記録する
// イベント名: click_out / パラメータ: link_type, link_label, link_domain
// ⚠GA4管理画面で カスタム定義 に link_type / link_label（イベントスコープ）を登録すると
//   ママさんスタジオの「みんなの反応」タブで内訳が見えるようになる
import { useEffect } from 'react'

function classify(host: string): string {
  if (/a8\.net$|\.a8\.net$/.test(host)) return 'アフィリエイト(A8)'
  if (/moshimo\.com$/.test(host)) return 'アフィリエイト(もしも)'
  if (/rakuten\.co\.jp$/.test(host) && /afl|hb\.afl|rpx/.test(host)) return 'アフィリエイト(楽天)'
  if (/valuecommerce\.com$/.test(host)) return 'アフィリエイト(VC)'
  if (/accesstrade\.net$/.test(host)) return 'アフィリエイト(AT)'
  if (/afi-b\.com$/.test(host)) return 'アフィリエイト(afb)'
  if (/trafficgate\.net$/.test(host)) return 'アフィリエイト(TG)'
  if (/line\.me$/.test(host)) return 'LINEスタンプ'
  if (/spotify\.com$|apple\.com$/.test(host) && /open\.|podcasts\./.test(host)) return 'ポッドキャスト'
  if (/amazon\.co\.jp$|amzn\.to$/.test(host)) return '商品リンク(Amazon)'
  if (/shopping\.yahoo\.co\.jp$|item\.rakuten/.test(host)) return '商品リンク'
  return '外部リンク'
}

export default function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a')
      if (!a || !a.href) return
      let url: URL
      try { url = new URL(a.href) } catch { return }
      if (url.host === location.host || !/^https?:/.test(url.protocol)) return
      const w = window as unknown as { gtag?: (...args: unknown[]) => void }
      if (!w.gtag) return
      const label = (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) || url.host
      w.gtag('event', 'click_out', {
        link_type: classify(url.host),
        link_label: label,
        link_domain: url.host,
        page_path: location.pathname,
      })
    }
    document.addEventListener('click', onClick, { capture: true, passive: true })
    return () => document.removeEventListener('click', onClick, { capture: true } as EventListenerOptions)
  }, [])
  return null
}
