# ワークスペース構成（アクティブ/アーカイブ）— 2025-10-14 時点

## アクティブ（開発対象）
- `mamasanlife-site/` — 本番フロントエンド（Next.js + Sanity）
- `tools/wxr-to-sanity/` — 移行パイプライン（WXR→Sanity、差分/画像/リンク補正）

## アーカイブ（今回の公開対象外）
- `archive/studio/` — Sanity Studio（ローカル）。ホステッドStudio運用に移行のため退避
- `archive/mamasan-web/` — 旧フロント
- `archive/hichimama-site/` — 別サイト雛形

## メモ
- ビルド/起動・デプロイは `mamasanlife-site/` のみを対象としてください。
- archive/ 配下は削除前提の保管領域です。復帰が必要なら `mv archive/<dir> ./<dir>` で戻せます。

