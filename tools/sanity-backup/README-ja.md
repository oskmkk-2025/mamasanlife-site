# Sanity データセットのバックアップ

停止後もデータにアクセスできるよう、Sanity 側もエクスポートしておくと安心です。

## データセットのエクスポート（NDJSON + メタ）

実行場所: `studio/`

```
npx sanity@latest dataset export staging ../backups/sanity-staging-$(date +%Y%m%d).tar.gz
```

## 画像アセットのダウンロード（任意）

`download-assets.js` は `sanity.imageAsset` の URL からローカルに画像を保存します。

```
node tools/sanity-backup/download-assets.js --project gqv363gs --dataset staging --out ./backups/sanity-assets
```

環境変数 `SANITY_READ_TOKEN` を設定するとプライベートでも取得できます。

