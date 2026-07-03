// 記事内のアフィリエイトボタン（htmlEmbed/affiliateButtonの
// `<a class="affiliate-btn affiliate-btn--◯◯">` 形式）を、
// CTAButtonと同じキャンディ型デザインで統一表示するためのコンポーネント。
// 生HTMLのまま表示すると記事ごとに見た目がバラつくため、表示時にここで変換する。

// ===== サービス別カラー（CTAButtonのSERVICE_CONFIGと同系統） =====
const VARIANT_CONFIG: Record<string, {
  icon: string
  lightColor: string
  baseColor: string
  darkColor: string
  shadowColor: string
  borderColor: string
  glowColor: string
}> = {
  amazon: { icon: 'a', lightColor: '#FFE0B8', baseColor: '#F5C896', darkColor: '#DFA060', shadowColor: '#B8712F', borderColor: '#D4905A', glowColor: 'rgba(245,200,150,0.55)' },
  rakuten: { icon: 'R', lightColor: '#EFC0BC', baseColor: '#D4908A', darkColor: '#BA6860', shadowColor: '#8C3E3A', borderColor: '#B05A55', glowColor: 'rgba(212,144,138,0.55)' },
  yahoo: { icon: '🛒', lightColor: '#C8DCEE', baseColor: '#90AECE', darkColor: '#6688AE', shadowColor: '#3A5E82', borderColor: '#5578A0', glowColor: 'rgba(144,174,206,0.55)' },
  curama: { icon: '🏠', lightColor: '#FFAA55', baseColor: '#FF8B1A', darkColor: '#D96A00', shadowColor: '#A84E00', borderColor: '#CC6E00', glowColor: 'rgba(255,139,26,0.55)' },
  study: { icon: '📖', lightColor: '#6698FF', baseColor: '#2D66E8', darkColor: '#1A4CC0', shadowColor: '#0E3090', borderColor: '#1A4CC0', glowColor: 'rgba(45,102,232,0.55)' },
  // a8 / others / moshimo / accesstrade / valuecommerce などはサイトブランドのティール
  generic: { icon: '✓', lightColor: '#A8D2CE', baseColor: '#6FA8A3', darkColor: '#4A7E7A', shadowColor: '#2F5654', borderColor: '#578E8A', glowColor: 'rgba(111,168,163,0.55)' },
}

function configFor(variant: string) {
  return VARIANT_CONFIG[variant] || VARIANT_CONFIG.generic
}

export type ParsedAffiliateCta = {
  variant: string
  href: string
  label: string
  pixel?: string
}

// アフィリエイトボタンHTMLを解析する。
// 「aタグ1個＋計測用1pxイメージ（任意）」だけで構成されるHTMLのみ変換対象。
// それ以外（複雑な埋め込み）はnullを返し、従来どおり生HTML表示にフォールバックする。
export function parseAffiliateCta(html: string): ParsedAffiliateCta | null {
  const src = String(html || '').trim()
  const anchorRe = /<a\s+[^>]*class="[^"]*affiliate-btn\s+affiliate-btn--(\w+)[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|<a\s+[^>]*href="([^"]+)"[^>]*class="[^"]*affiliate-btn\s+affiliate-btn--(\w+)[^"]*"[^>]*>([\s\S]*?)<\/a>/
  const m = src.match(anchorRe)
  if (!m) return null
  const variant = (m[1] || m[5] || 'generic').toLowerCase()
  const href = m[2] || m[4] || ''
  const rawLabel = (m[3] ?? m[6] ?? '')

  // aタグと計測イメージを除いた残りに実質的な内容があれば変換しない
  const rest = src.replace(m[0], '').replace(/<img[^>]*>/gi, '').replace(/<br\s*\/?\s*>/gi, '').trim()
  if (rest) return null

  // ラベル整形: タグ除去→空白圧縮→末尾の矢印記号除去（矢印は部品で表示するため）
  const label = rawLabel
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[＞>»›\s]+$/g, '')
    .trim()
  if (!href || !label) return null

  const pixelMatch = src.match(/<img[^>]*src="([^"]*(?:0\.gif|impression|itp\.gif)[^"]*)"[^>]*>/i)
  return { variant, href, label, pixel: pixelMatch?.[1] }
}

export default function AffiliateCtaButton({ variant, href, label, pixel }: ParsedAffiliateCta) {
  const cfg = configFor(variant)
  const btnStyle: React.CSSProperties = {
    background: `linear-gradient(175deg, ${cfg.lightColor} 0%, ${cfg.baseColor} 40%, ${cfg.darkColor} 100%)`,
    border: `2.5px solid ${cfg.borderColor}`,
    boxShadow: `0 6px 0 ${cfg.shadowColor}, 0 10px 28px ${cfg.glowColor}, inset 0 -3px 8px rgba(0,0,0,0.12)`,
  }
  return (
    <div className="cta-candy-group my-6">
      <a
        href={href}
        target="_blank"
        rel="noopener nofollow sponsored"
        className="cta-candy-link"
        aria-label={`${label}（外部リンク）`}
      >
        <span className="cta-candy-btn" style={btnStyle}>
          <span className="cta-candy-btn__highlight" aria-hidden="true" />
          <span className="cta-candy-btn__icon-wrap" aria-hidden="true">
            <span className="cta-candy-btn__icon" style={{ color: cfg.darkColor }}>{cfg.icon}</span>
          </span>
          <span className="cta-candy-btn__sep" aria-hidden="true" />
          <span className="cta-candy-btn__label">{label}</span>
          <span className="cta-candy-btn__arrow" aria-hidden="true" style={{ color: cfg.darkColor }}>&#8250;</span>
        </span>
      </a>
      {pixel ? (
        /* ASPの成果計測用1pxイメージ（削除するとインプレッション計測が止まる） */
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={pixel} width={1} height={1} alt="" style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
      ) : null}
    </div>
  )
}
