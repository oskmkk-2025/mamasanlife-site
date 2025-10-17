# 環境変数セットアップ手順

このプロジェクト（Next.js + Sanity）をローカル/本番で動かすために必要な環境変数の一覧です。

## 必須（Sanity）
- `NEXT_PUBLIC_SANITY_PROJECT_ID` — Sanity プロジェクトID（例: `gqv363gs`）
- `NEXT_PUBLIC_SANITY_DATASET` — 使用する Dataset 名（例: `production` / `staging`）

## 任意（推奨）
- `SANITY_API_VERSION` — API バージョン（既定: `2024-03-14`）
- `SANITY_READ_TOKEN` — 読み取りトークン（Dataset が Private の場合は必須。Server 環境変数として設定）
- `NEXT_PUBLIC_NOINDEX` — `true` の場合、noindex ヘッダを付与（Preview 環境で推奨）

## ローカル開発
1. ルートにある `.env.local.example` をコピーして `.env.local` を作成
2. 上記の値を編集（`SANITY_READ_TOKEN` は任意・Private の場合のみ）
3. 依存関係インストール → `npm install`
4. 開発サーバ → `npm run dev`

## Vercel（本番/プレビュー）
Project → Settings → Environment Variables に以下を設定（Production と Preview 両方）：
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_READ_TOKEN`（Private Dataset の場合）
- 任意 `SANITY_API_VERSION`, `NEXT_PUBLIC_NOINDEX`

> メモ: `SANITY_READ_TOKEN` は**Server 専用**です。`NEXT_PUBLIC_` を付けないでください。

