// ポッドキャスト番組の設定（RSSフィードと/podcastページの共通ソース）
// 番組名・説明を変えたいときはここだけ直す。反映はデプロイ（git push）で。
export const PODCAST = {
  title: 'ママさんライフラジオ',
  description:
    'FP2級ワーママ「ひーちママ」が、家計・固定費削減・子育て・40代の働き方を実体験ベースでゆるっと話すラジオ。ブログ「ママさんライフ」の音声版です。',
  author: 'ひーちママ',
  // Apple Podcasts登録時に所有者確認メールが届くアドレス。RSSに公開されるので
  // スパムが気になる場合は専用アドレスに変えてOK（Spotifyはメール不要）。
  ownerEmail: 'oskmkk@gmail.com',
  language: 'ja',
  explicit: false,
  category: 'Business',
  subcategory: 'Investing',
  category2: 'Kids & Family',
  subcategory2: 'Parenting',
  base: 'https://mamasanmoney-bu.com',
  link: 'https://mamasanmoney-bu.com/podcast',
  artwork: 'https://mamasanmoney-bu.com/podcast/artwork.png',
  feed: 'https://mamasanmoney-bu.com/podcast/feed.xml',
}
