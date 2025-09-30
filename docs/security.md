# セキュリティ強化メモ（Secrets/Headers/運用）

## 1) シークレットの扱い
- 読み取りトークンは `SANITY_READ_TOKEN`（Server 環境変数）で管理。 `NEXT_PUBLIC_` を付けない。
- Vercel では Project → Settings → Environment Variables に登録（Production/Preview それぞれ必要）。
- トークンは**サーバーのみ**で使用。`lib/sanity.client.ts` は `import 'server-only'` を宣言しており、クライアント側で誤使用するとビルド時にエラーになります。
- ローカルでは `.env.local` に設定し、Git には絶対にコミットしない（`.gitignore` 済み）。
- 漏えい時の手順: 速やかにトークンを Revoke → 新規発行 → 環境変数を更新 → ログを確認。

## 2) セキュリティヘッダ
- `next.config.mjs` に以下のヘッダを付与：
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-Frame-Options: SAMEORIGIN`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `X-Robots-Tag: noindex`（`NEXT_PUBLIC_NOINDEX=true` のとき自動付与）
- 必要に応じて CSP を段階導入（Adsense を利用するため、導入時は出力先ドメインの洗い出しが必要）。

## 3) 予防策（コード）
- `lib/sanity.client.ts` は `server-only` 指定でサーバー限定。
- クライアントコンポーネントから直接 `sanityClient` を import しない。必要なら Route Handler 経由で取得。

## 4) Git での秘密情報対策
- `.gitignore` に `.env*` / `.vercel` / `.next` を追加済み。
- 任意: gitleaks などのシークレットスキャンを導入（CIでの実行推奨）。

## 5) Vercel 側の推奨設定
- 環境変数は Production/Preview で分離。不要時は削除。
- チーム利用時は Role を最小権限で付与。Env 変更は Approvals を必須に。
- Preview 環境は `NEXT_PUBLIC_NOINDEX=true` にし、インデックス防止（robots.txt とヘッダ両面）。

## 6) Sanity 側
- Manage → CORS Origins に本番/プレビューのドメインを登録。
- Dataset が Private の場合は読み取りトークンを使用し、Studio 以外からの書き込み用トークンは作らない。
- 不要になったトークンは Revoke。

