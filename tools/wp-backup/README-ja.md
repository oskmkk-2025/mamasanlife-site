# WordPress 停止前の最終バックアップ手順（ssh/rsync 版）

このディレクトリの `backup.sh` は、WordPress 停止後も参照できるように最低限の実体を退避します。

含めるもの（推奨）
- `wp-content/uploads/`（画像ファイル本体）
- DB ダンプ（`mysqldump` の SQL）
- `wp-content/themes/`（テーマ一式・子テーマ）
- `wp-config.php`（接続情報の控え）

## 使い方（テンプレート）

環境変数で接続先を指定して実行します。

```
export WP_SSH="user@example.com"            # SSH ログイン（user@host）
export WP_ROOT="/var/www/html"             # WordPress ルート
export WP_DB_NAME="wp_db"                  # DB 名
export WP_DB_USER="wp_user"                # DB ユーザ
export WP_DB_PASS="***"                     # DB パスワード
export WP_DB_HOST="127.0.0.1"              # DB ホスト（省略可）
export SSH_PORT=22                           # SSH ポート（省略可）

bash tools/wp-backup/backup.sh
```

出力先
- `backups/wp/YYYYMMDD-HHmmss/` に `uploads.tar.gz` / `themes.tar.gz` / `db.sql.gz` / `wp-config.php` を保存します。

注意
- 共有サーバーでは `mysqldump` が使えない場合があります。その場合はサーバーのコントロールパネル（phpMyAdmin など）で SQL をエクスポートしてください。
- パスワード等は履歴に残さないよう、 `.bash_history` 等への記録を避けてください。

