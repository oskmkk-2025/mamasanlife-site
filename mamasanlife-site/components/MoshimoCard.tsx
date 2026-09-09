import { CANDY_CONFIG, detectAffiliateVariant } from '@/lib/affiliate'

// もしもアフィリエイトの「かんたんリンク」カード。
// 記事ページとプレビューの両方から使う（別々に書いていて見た目がずれた・2026-09-09）
export function MoshimoCard({ data }: { data: any }) {
  if (!data) return null
  return (
    <div className="moshimo-card my-5">
      {data.image && (
        <div className="moshimo-card__image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.image} alt={data.title || ''} />
        </div>
      )}
      <div className="moshimo-card__body">
        {data.brand && <p className="text-xs text-gray-500 mb-1">{data.brand}</p>}
        {data.title && <p className="font-semibold text-base text-gray-900">{data.title}</p>}
        <div className="moshimo-card__buttons mt-3">
          {(data.buttons || []).map((btn: any, idx: number) => {
            const variant = detectAffiliateVariant(btn.url) || 'others'
            const cfg = CANDY_CONFIG[variant] || CANDY_CONFIG['others']
            return (
              <a
                key={idx}
                href={btn.url}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className={`affiliate-btn affiliate-btn--${variant}`}
                style={btn.color ? { background: btn.color } : undefined}
              >
                <span className="cta-candy-btn__highlight" aria-hidden="true" />
                <span className="cta-candy-btn__icon-wrap" aria-hidden="true">
                  <span className="cta-candy-btn__icon">{cfg.icon}</span>
                </span>
                <span className="cta-candy-btn__sep" aria-hidden="true" />
                <span className="cta-candy-btn__label">{btn.label || cfg.label}</span>
                <span className="cta-candy-btn__arrow" aria-hidden="true">&#8250;</span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
