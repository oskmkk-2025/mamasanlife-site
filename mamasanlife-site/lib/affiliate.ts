// アフィリエイトリンクの見分けと、キャンディ風ボタンの設定。
// 記事ページとプレビューで別々に持っていたせいで見た目がずれた事故があり、
// 1か所にまとめた（2026-09-09）。
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://mamasanmoney-bu.com'

// キャンディ風ボタン用アイコン・カラー設定
export const CANDY_CONFIG: Record<string, { icon: string; label: string }> = {
  amazon:         { icon: 'a',  label: 'Amazonで見る' },
  rakuten:        { icon: 'R',  label: '楽天市場で見る' },
  yahoo:          { icon: '🛒', label: 'Yahoo!ショッピングで見る' },
  curama:         { icon: '🏠', label: 'くらしのマーケットで見る' },
  moshimo:        { icon: '🛍', label: 'こちらで見る' },
  valuecommerce:  { icon: '🛍', label: 'こちらで見る' },
  a8:             { icon: '🛍', label: 'こちらで見る' },
  afb:            { icon: '🛍', label: 'こちらで見る' },
  study:          { icon: '📖', label: 'スタディサプリで見る' },
  audiobook:      { icon: '🎧', label: 'audiobookで聴く' },
  others:         { icon: '🛍', label: 'こちらで見る' },
}


const AFFILIATE_HOSTS = [
  { match: 'hb.afl.rakuten.co.jp', variant: 'rakuten' },
  { match: 'item.rakuten.co.jp', variant: 'rakuten' },
  { match: 'books.rakuten.co.jp', variant: 'rakuten' },
  { match: 'search.rakuten.co.jp', variant: 'rakuten' },
  { match: 'rakuten.co.jp', variant: 'rakuten' },
  { match: 'ck.jp.ap.valuecommerce.com', variant: 'valuecommerce' },
  { match: 'px.a8.net', variant: 'a8' },
  { match: 'moshimo.com', variant: 'moshimo' },
  { match: 'amazon.co.jp', variant: 'amazon' },
  { match: 'amzn.to', variant: 'amazon' },
  { match: 'amzn.asia', variant: 'amazon' },
  { match: 'shopping.yahoo.co.jp', variant: 'yahoo' },
  { match: 'store.shopping.yahoo.co.jp', variant: 'yahoo' },
  { match: 'curama.jp', variant: 'curama' },
  { match: 'studysapuri.jp', variant: 'study' },
  { match: 'audiobook.jp', variant: 'audiobook' },
  { match: 'audible.co.jp', variant: 'audiobook' },
  { match: 'amazon.co.jp/audible', variant: 'audiobook' },
  { match: 'afb', variant: 'afb' },
  { match: 'curama.jp', variant: 'curama' },
  // 楽天でも別ドメインの金融サービスは 'rakuten.co.jp' に一致せずボタンにならなかった（2026-08-25追加）
  { match: 'rakuten-sec.co.jp', variant: 'rakuten' },
  // 楽天銀行は提携先が見つからなかった（TG却下・A8/もしも/ATにも案件なし・2026-08-25）。
  // 報酬にならないものをCTAボタンに見せると広告と誤解されるため、素のリンクのままにする
  { match: 'rakuten-card.co.jp', variant: 'rakuten' },
  // TGアフィリエイト（楽天証券などの計測リンク）
  { match: 'trafficgate.net', variant: 'a8' }
]

export function detectAffiliateVariant(href?: string | null, depth = 0): string | null {
  if (!href) return null
  try {
    const url = new URL(href, SITE_ORIGIN)
    const host = url.hostname.replace(/^www\./, '')
    if (/appreach|nabettu\.github\.io/.test(host)) return null
    // もしも・バリューコマース等の中継リンクは、行き先(url=)のショップで見分ける。
    // ホスト名だけで判定すると Amazon・楽天・Yahoo が全部「もしも」になり、
    // かんたんリンクの3つのボタンが同じ🛍アイコンになってしまう（2026-09-09修正）
    if (depth === 0 && /moshimo\.com|valuecommerce\.com|a8\.net/.test(host)) {
      const dest = url.searchParams.get('url') || url.searchParams.get('vc_url')
      if (dest) {
        const inner = detectAffiliateVariant(dest, 1)
        if (inner) return inner
      }
    }
    const match = AFFILIATE_HOSTS.find(entry => host.includes(entry.match))
    return match?.variant || null
  } catch {
    return null
  }
}
