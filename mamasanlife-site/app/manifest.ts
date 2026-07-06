import type { MetadataRoute } from 'next'

// ホーム画面に追加したとき「Webアプリ（全画面）」ではなく通常のブラウザで開かせる。
// iOSは近年、manifest未指定だと既定で全画面のWebアプリとして開くようになったため、
// display: 'browser' を明示して戻るボタン・アドレスバーを残す（本人の要望 2026-07-06）。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mamasan Life',
    short_name: 'Mamasan Life',
    description: 'FP2級ママの家計改善ブログ',
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#2f6f6a',
    icons: [
      {
        src: '/icons/favicon.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  }
}
