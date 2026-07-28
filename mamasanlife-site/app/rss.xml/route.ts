// /rss.xml は /feed.xml と同一内容（一本化）。
// 旧WordPressのURL互換のため残しているルート。人気ブログランキング等が /feed 経由でここを購読している。
// 本体の実装は app/feed.xml/route.ts（アイキャッチ画像入り・予約公開記事の除外込み）。
export { GET, revalidate } from '../feed.xml/route'
