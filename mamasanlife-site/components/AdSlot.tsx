"use client"
import { useEffect } from 'react'

type Props = {
  slot: string
  layout?: string
  format?: string
  responsive?: boolean
  className?: string
}

const SLOT_ENV_MAP: Record<string, { value?: string; env: string; label: string }> = {
  'ARTICLE_TOP_SLOT': { value: process.env.NEXT_PUBLIC_GADS_SLOT_ARTICLE_TOP, env: 'NEXT_PUBLIC_GADS_SLOT_ARTICLE_TOP', label: '記事上広告' },
  'ARTICLE_BOTTOM_SLOT': { value: process.env.NEXT_PUBLIC_GADS_SLOT_ARTICLE_BOTTOM, env: 'NEXT_PUBLIC_GADS_SLOT_ARTICLE_BOTTOM', label: '記事下広告' },
  'SIDEBAR_SLOT': { value: process.env.NEXT_PUBLIC_GADS_SLOT_SIDEBAR, env: 'NEXT_PUBLIC_GADS_SLOT_SIDEBAR', label: 'サイドバー広告' },
  'IN_ARTICLE_SLOT': { value: process.env.NEXT_PUBLIC_GADS_SLOT_IN_ARTICLE, env: 'NEXT_PUBLIC_GADS_SLOT_IN_ARTICLE', label: '本文中広告' }
}

function resolveSlotAlias(nameOrId: string | undefined): { slot?: string; env?: string; label?: string } {
  if (!nameOrId) return undefined
  // If numeric-looking, return as-is
  if (/^\d{6,}$/.test(nameOrId)) return { slot: nameOrId }
  const entry = SLOT_ENV_MAP[nameOrId]
  if (entry) return { slot: entry.value, env: entry.env, label: entry.label }
  return { slot: undefined }
}

export function AdSlot({ slot, layout, format = 'auto', responsive = true, className }: Props) {
  const rawClient = process.env.NEXT_PUBLIC_ADSENSE_ID
  const client = rawClient ? (rawClient.startsWith('ca-') ? rawClient : `ca-${rawClient}`) : undefined
  const aliasInfo = resolveSlotAlias(slot)
  const resolvedSlot = aliasInfo?.slot?.trim()
  useEffect(() => {
    try { (window as any).adsbygoogle = (window as any).adsbygoogle || []; (window as any).adsbygoogle.push({}) } catch {}
  }, [])
  if (!client) return <div className="ads-fallback">AdSense未設定（NEXT_PUBLIC_ADSENSE_ID）</div>
  const validSlot = resolvedSlot && /^\d{6,}$/.test(resolvedSlot)
  if (!validSlot) {
    return (
      <div className="ads-fallback">
        広告ユニットID未設定（{aliasInfo?.label || slot}）。AdSenseの「広告ユニット ID」を環境変数 {aliasInfo?.env || `NEXT_PUBLIC_GADS_SLOT_${slot}`} に設定してください。
      </div>
    )
  }
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
