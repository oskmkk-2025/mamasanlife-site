# mamasanlife-site（mamasanmoney-bu.com）

このリポジトリはひーちママのブログ。**月10万円の収益ブログ化をAIが自律運用中**。

## 最初に読むもの

- **docs/blog-operations.md** ← 運用のすべて（戦略・コマンド・ルール・文体）。作業前に必ず読む
- AGENTS.md ← 日本語コミュニケーション方針

## 構成の要点

- 本番コードは `mamasanlife-site/` サブフォルダ（Vercelのroot directory）。**ルート直下にはコードを置かない**
- 記事本文はSanity（project gqv363gs / dataset production）。記事編集は `mamasanlife-site/scripts/blog/` のツールを使う
- mainへのpushで自動デプロイ。Sanityの記事変更はデプロイ不要（ISR最大1時間）

## 🚫 絶対ルール（詳細は docs/blog-operations.md §3）

1. silver-tutor / silver-tutors-experience1 の復元禁止（本人が意図的に削除。middlewareが410を返す）
2. 体験談の捏造禁止
3. 読者向け配信（LINE等）は本人の事前確認必須
4. ASP等へのログイン・パスワード入力はしない
5. layout.tsxに全ページ共通のcanonicalを書かない（過去に大事故の原因）
