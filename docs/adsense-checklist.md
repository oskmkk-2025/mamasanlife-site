# AdSense 審査チェックリスト（15記事版）

- [ ] 5カテゴリに各2〜3記事：合計15記事公開
- [ ] 固定ページフッター常時リンク：About / Policy / Contact / Terms / Disclaimer
- [ ] 広告枠：記事上・記事下・サイドバー（`components/AdSlot` で設置済み。slotは本番値に変更）
- [ ] サイトマップ：/sitemap.xml をSearch Consoleへ送信
- [ ] robots：本番時に `NEXT_PUBLIC_NOINDEX=false`
- [ ] GA4：`NEXT_PUBLIC_GA_ID` を設定
- [ ] サイト速度：Lighthouse Performance/SEO ≥ 90
- [ ] ページUX：CLS≤0.1 / LCP≤2.5s / INP≤200ms の目安
