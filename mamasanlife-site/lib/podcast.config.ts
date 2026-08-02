// ポッドキャスト番組の設定（RSSフィードと/podcastページの共通ソース）
// 番組名・説明を変えたいときはここだけ直す。反映はデプロイ（git push）で。
export const PODCAST = {
  title: 'ママさんライフラジオ',
  description:
    'FP2級ワーママ「ひーちママ」が、家計・固定費削減・子育て・40代の働き方を実体験ベースでゆるっと話すラジオ。ブログ「ママさんライフ」の音声版です。',
  author: 'ひーちママ',
  // 所有者確認メールが届くアドレス。RSSに公開されるため匿名運用ルールに合わせて専用アドレスを使用（2026-07-19変更）
  ownerEmail: 'oskmkk2@gmail.com',
  language: 'ja',
  explicit: false,
  category: 'Business',
  subcategory: 'Investing',
  category2: 'Kids & Family',
  subcategory2: 'Parenting',
  base: 'https://mamasanmoney-bu.com',
  link: 'https://mamasanmoney-bu.com/podcast',
  // 2026-08-02: 元のartwork.png(5.8MB)は配信プラットフォームが取り込めず古い画像のままだったため、
  // 2000×2000/399KBのJPEGに差し替え。URLも変えて再クロールを促している。
  artwork: 'https://mamasanmoney-bu.com/podcast/artwork-v2.jpg',
  feed: 'https://mamasanmoney-bu.com/podcast/feed.xml',
}
