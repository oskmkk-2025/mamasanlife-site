import Link from 'next/link'

// ===== 型定義 =====
export type CTAButtonType = 'amazon' | 'rakuten' | 'yahoo' | 'kurashi' | 'study'

export interface CTAButtonProps {
  type: CTAButtonType
  label?: string
  url: string
  className?: string
}

// ===== サービス設定 =====
const SERVICE_CONFIG: Record<CTAButtonType, {
  label: string
  icon: string
  lightColor: string
  baseColor: string
  darkColor: string
  shadowColor: string
  borderColor: string
  glowColor: string
}> = {
  amazon: {
    label: 'Amazonで見る',
    icon: 'a',
    lightColor: '#FFE0B8',
    baseColor: '#F5C896',
    darkColor: '#DFA060',
    shadowColor: '#B8712F',
    borderColor: '#D4905A',
    glowColor: 'rgba(245,200,150,0.55)',
  },
  rakuten: {
    label: '楽天市場で見る',
    icon: 'R',
    lightColor: '#EFC0BC',
    baseColor: '#D4908A',
    darkColor: '#BA6860',
    shadowColor: '#8C3E3A',
    borderColor: '#B05A55',
    glowColor: 'rgba(212,144,138,0.55)',
  },
  yahoo: {
    label: 'Yahoo!ショッピングで見る',
    icon: '🛒',
    lightColor: '#C8DCEE',
    baseColor: '#90AECE',
    darkColor: '#6688AE',
    shadowColor: '#3A5E82',
    borderColor: '#5578A0',
    glowColor: 'rgba(144,174,206,0.55)',
  },
  kurashi: {
    label: 'くらしのマーケットで見る',
    icon: '🏠',
    lightColor: '#FFAA55',
    baseColor: '#FF8B1A',
    darkColor: '#D96A00',
    shadowColor: '#A84E00',
    borderColor: '#CC6E00',
    glowColor: 'rgba(255,139,26,0.55)',
  },
  study: {
    label: 'スタディサプリで見る',
    icon: '📖',
    lightColor: '#6698FF',
    baseColor: '#2D66E8',
    darkColor: '#1A4CC0',
    shadowColor: '#0E3090',
    borderColor: '#1A4CC0',
    glowColor: 'rgba(45,102,232,0.55)',
  },
}

// ===== コンポーネント本体 =====
export default function CTAButton({ type, label, url, className = '' }: CTAButtonProps) {
  const cfg = SERVICE_CONFIG[type]
  const displayLabel = label ?? cfg.label
  const isExternal = url.startsWith('http')

  const btnStyle: React.CSSProperties = {
    background: `linear-gradient(175deg, ${cfg.lightColor} 0%, ${cfg.baseColor} 40%, ${cfg.darkColor} 100%)`,
    border: `2.5px solid ${cfg.borderColor}`,
    boxShadow: `0 6px 0 ${cfg.shadowColor}, 0 10px 28px ${cfg.glowColor}, inset 0 -3px 8px rgba(0,0,0,0.12)`,
  }

  const inner = (
    <span className={`cta-candy-btn${className ? ' ' + className : ''}`} style={btnStyle}>
      {/* 艶ハイライト */}
      <span className="cta-candy-btn__highlight" aria-hidden="true" />
      {/* 左アイコンエリア */}
      <span className="cta-candy-btn__icon-wrap" aria-hidden="true">
        <span className="cta-candy-btn__icon">{cfg.icon}</span>
      </span>
      {/* 点線セパレーター */}
      <span className="cta-candy-btn__sep" aria-hidden="true" />
      {/* テキスト */}
      <span className="cta-candy-btn__label">{displayLabel}</span>
      {/* 右矢印 */}
      <span className="cta-candy-btn__arrow" aria-hidden="true">&#8250;</span>
    </span>
  )

  if (isExternal) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="cta-candy-link"
        aria-label={`${displayLabel}（外部サイトへ）`}
      >
        {inner}
      </a>
    )
  }

  return (
    <Link href={url} className="cta-candy-link" aria-label={displayLabel}>
      {inner}
    </Link>
  )
}

// ===== 複数ボタンをまとめるラッパー =====
export function CTAButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="cta-candy-group" role="group" aria-label="購入リンク">
      {children}
    </div>
  )
}
