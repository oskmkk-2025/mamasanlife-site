"use client"
import { useEffect } from 'react'

type Props = {
  slot: string
  layout?: string
  format?: string
  responsive?: boolean
  className?: string
}

function resolveSlotAlias(nameOrId: string | undefined): string | undefined {
  if (!nameOrId) return undefined
  // If numeric-looking, return as-is
  if (/^\d{6,}$/.test(nameOrId)) return nameOrId
  const map: Record<string,string|undefined> = {
    'ARTICLE_TOP_SLOT': process.env.NEXT_PUBLIC_GADS_SLOT_ARTICLE_TOP,
    'ARTICLE_BOTTOM_SLOT': process.env.NEXT_PUBLIC_GADS_SLOT_ARTICLE_BOTTOM,
    'SIDEBAR_SLOT': process.env.NEXT_PUBLIC_GADS_SLOT_SIDEBAR,
    'IN_ARTICLE_SLOT': process.env.NEXT_PUBLIC_GADS_SLOT_IN_ARTICLE,
  }
  return map[nameOrId]
}

export function AdSlot({ slot, layout, format = 'auto', responsive = true, className }: Props) {
  const rawClient = process.env.NEXT_PUBLIC_ADSENSE_ID
  const client = rawClient ? (rawClient.startsWith('ca-') ? rawClient : `ca-${rawClient}`) : undefined
  const resolvedSlot = resolveSlotAlias(slot) || slot
  useEffect(() => {
    try { (window as any).adsbygoogle = (window as any).adsbygoogle || []; (window as any).adsbygoogle.push({}) } catch {}
  }, [])
  if (!client) return <div className="ads-fallback">AdSense未設定（NEXT_PUBLIC_ADSENSE_ID）</div>
  if (!resolvedSlot) return <div className="ads-fallback">ad-slot未設定</div>
  return (
    <ins className={`adsbygoogle block ${className || ''}`}
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={resolvedSlot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
      data-ad-layout={layout}
      {...(process.env.NODE_ENV !== 'production' ? { 'data-adtest': 'on' } as any : {})}
    />
  )
}
