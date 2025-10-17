# レイアウト骨組みToDo（B）— 2025-10-14

本番までの“建物の骨組み”作り。例え話では、先に館の柱・通路・案内板を立てる段階です。

## 1) Header（正面看板＋案内所）
- 目的: ロゴ・グローバルメニュー・検索/サイトマップ/問い合わせの導線を常設。
- 実装タスク
  - [ ] `components/Header.tsx`（PC）: ロゴ / メニュー6カテゴリ / ユーティリティ（検索/サイトマップ/問い合わせ）
  - [ ] `components/MobileHeader.tsx`（SP）: ハンバーガー / ロゴ / 検索トリガー
  - [ ] `components/GlobalNav.tsx`: メニュー配列をprops化（例: categories定義から）
  - [ ] キーボード操作（Tab/Shift+Tab/Enter/Space）とフォーカスリング対応
- 受入基準
  - ロゴ→トップ遷移 / メニュー→カテゴリ遷移 / キー操作で全リンクに到達

## 2) Footer（総合案内＋非常口）
- 目的: カテゴリ再掲 / 固定ページ / 規約関連を集約。
- 実装タスク
  - [ ] `components/Footer.tsx`: カテゴリ一覧 / 固定リンク（About/Contact/Policy/Terms/SiteMap）
  - [ ] コピーライト / 小さな文字の可読性確保（コントラスト AA）
- 受入基準
  - 主要リンクが全て1クリック以内 / スマホで読みやすい行間

## 3) AppLayout（柱と通路）
- 目的: 画面余白・幅・フォント・色の“館内共通ルール”。
- 実装タスク
  - [ ] `app/layout.tsx` の骨組み整備（<Header/><main/><Footer/>）
  - [ ] `styles/globals.css` or `app/globals.css` のユーティリティ（container, spacing, focus）
  - [ ] コンテナ幅: sm/md/lg/xl（例: 640/768/1024/1280px）
- 受入基準
  - どのページも“枠だけ”で崩れず表示 / スクロールバー発生時も見切れない

## 4) Breadcrumbs（現在地の通路表示）
- 目的: いまどこ？に即答。検索エンジンにも道案内（構造化データ）。
- 実装タスク
  - [ ] `components/Breadcrumbs.tsx`: Home > カテゴリ > 記事
  - [ ] `schema.org/BreadcrumbList` の JSON-LD を `<script type="application/ld+json">` で埋め込み
- 受入基準
  - SR（スクリーンリーダ）で“ナビゲーション: パンくず”と読める / JSON-LD が検証OK

## 5) Card & List（商品カードと棚）
- 目的: 記事一覧の共通UI。タイトル/画像/抜粋/日付/カテゴリを表示。
- 実装タスク
  - [ ] `components/PostCard.tsx`: props={title, slug, category, imageUrl, excerpt, date}
  - [ ] `components/PostList.tsx`: グリッド/リスト切替（PC: 3列, SP: 1列）
  - [ ] スケルトン表示（データ待ち時の骨）
- 受入基準
  - 画像比率が崩れない / リンクがカード全体で押せる / キー操作でフォーカス可

## 6) SearchForm（案内所の“質問”窓口）
- 目的: /search?q= へ遷移する最小フォーム（入力＋送信）。
- 実装タスク
  - [ ] `components/SearchForm.tsx`: input(name=q) + submit、ヘッダー/モバイル兼用
  - [ ] Enter で送信 / クリア（×）付与（任意）
- 受入基準
  - 無入力で送信しない / 既存の /search ページに連携

## 7) 共通ユーティリティ（読みやすさの下地）
- 目的: 一貫した余白/フォーカス/色。将来のCSP-RO導入も見据え、inline style を避ける。
- 実装タスク
  - [ ] `styles/utilities.css`（またはTailwind設定）: focus-visible, sr-only, container, spacing
  - [ ] 画像は `next/image` or Sanityのimage-URLビルダで最適化
- 受入基準
  - コントラストAA / キーボードフォーカスが視認できる

---

## 優先着手順（おすすめ）
1. GlobalNav（配列→UI）→ Header（PC/SP）
2. AppLayout → Footer
3. Breadcrumbs → PostCard → PostList
4. SearchForm → 共通ユーティリティ微調整

## 所要見積
- Header/GlobalNav: 2.0h
- Footer: 0.8h
- AppLayout/スタイル下地: 1.2h
- Breadcrumbs（含むJSON-LD）: 0.8h
- PostCard/PostList: 1.5h
- SearchForm: 0.5h
- 合計: 約6.8h（+バッファ20%で8h）

## Doneの定義（チェック）
- [ ] 主要ページで共通レイアウトが崩れない
- [ ] キーボード操作で全リンクに到達できる
- [ ] JSON-LD（BreadcrumbList）の検証OK
- [ ] CLS/LCPが開発環境で大きく悪化していない

## メモ
- 例え話: 「まず柱（Layout）と案内板（Header/Footer）を立て、通路表示（Breadcrumbs）を付け、商品棚（List）と商品カード（Card）を設置。最後に案内所の窓口（Search）を開ける。」
