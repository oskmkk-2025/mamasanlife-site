export type PaywallConfig = {
  /** codoc entry code (e.g. f9E59PN70w). Used to build the purchase URL / embed. */
  entryCode?: string
  /** codoc user code required for embedding (data-usercode). */
  codocUserCode?: string
  /** Optional css theme for codoc embed. */
  codocCss?: string
  /** Optional direct purchase URL if codoc entry code should not be used. */
  codocUrl?: string
  /** Number of Portable Text blocks to show before the paywall. */
  previewBlocks?: number
  /** Optional price label shown next to the CTA. */
  priceLabel?: string
  /** Optional custom message displayed above the purchase button. */
  message?: string
}

/**
 * Articles that should remain paywalled on the public site.
 * Keys are Sanity slugs (post.slug).
 */
export const PAYWALLED_ARTICLES: Record<string, PaywallConfig> = {
  'blog-1st-year-2nd-year-pv-and-profit': {
    entryCode: 'f9E59PN70w',
    codocUserCode: 'UMquYFhjGw',
    codocCss: 'rainbow-square',
    previewBlocks: 6,
    priceLabel: '¥980',
    message: 'この記事の続きは codoc の有料マガジンで読めます。'
  },
  'silver-tutor': {
    entryCode: 'Gs8kvjOBHg',
    codocUserCode: 'UMquYFhjGw',
    codocCss: 'rainbow-square',
    previewBlocks: 5,
    priceLabel: '¥300',
    message: '家庭教師の詳しい体験談は codoc で公開しています。'
  },
  'silver-tutors-experience1': {
    entryCode: 'qEF41bBNjQ',
    codocUserCode: 'UMquYFhjGw',
    codocCss: 'rainbow-square',
    previewBlocks: 5,
    priceLabel: '¥300',
    message: '指導の具体的な内容と費用の内訳は codoc 記事でお読みいただけます。'
  }
}
