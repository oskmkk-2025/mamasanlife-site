"use client"
import { useEffect } from 'react'

type Props = {
  slot: string
  layout?: string
  format?: string
  responsive?: boolean
  className?: string
}

export function AdSlot({ slot, layout, format = 'auto', responsive = true, className }: Props) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_ID
  useEffect(() => {
    try { (window as any).adsbygoogle = (window as any).adsbygoogle || []; (window as any).adsbygoogle.push({}) } catch {}
  }, [])
  if (!client) return <div className="ads-fallback">AdSense未設定（NEXT_PUBLIC_ADSENSE_ID）</div>
  return (
    <ins className={`adsbygoogle block ${className || ''}`}
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
      data-ad-layout={layout}
    />
  )
}

