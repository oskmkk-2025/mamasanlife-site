#!/usr/bin/env bash
set -euo pipefail

# Inputs
: "${WP_SSH:?set WP_SSH like user@host}"
: "${WP_ROOT:?set WP_ROOT like /var/www/html}"
: "${WP_DB_NAME:?set WP_DB_NAME}"
: "${WP_DB_USER:?set WP_DB_USER}"
: "${WP_DB_PASS:?set WP_DB_PASS}"
WP_DB_HOST="${WP_DB_HOST:-127.0.0.1}"
SSH_PORT="${SSH_PORT:-22}"

STAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="$(pwd)/backups/wp/${STAMP}"
mkdir -p "$OUTDIR"

echo "[wp-backup] Output: $OUTDIR"

ssh -p "$SSH_PORT" "$WP_SSH" "set -e; cd '$WP_ROOT'; \
  tar -czf /tmp/uploads-${STAMP}.tar.gz -C wp-content uploads; \
  tar -czf /tmp/themes-${STAMP}.tar.gz -C wp-content themes; \
  cp -f wp-config.php /tmp/wp-config-${STAMP}.php; \
  mysqldump -h '$WP_DB_HOST' -u '$WP_DB_USER' -p'$WP_DB_PASS' '$WP_DB_NAME' | gzip -c > /tmp/db-${STAMP}.sql.gz"

scp -P "$SSH_PORT" "$WP_SSH:/tmp/uploads-${STAMP}.tar.gz" "$OUTDIR/uploads.tar.gz"
scp -P "$SSH_PORT" "$WP_SSH:/tmp/themes-${STAMP}.tar.gz" "$OUTDIR/themes.tar.gz"
scp -P "$SSH_PORT" "$WP_SSH:/tmp/db-${STAMP}.sql.gz" "$OUTDIR/db.sql.gz"
scp -P "$SSH_PORT" "$WP_SSH:/tmp/wp-config-${STAMP}.php" "$OUTDIR/wp-config.php"

ssh -p "$SSH_PORT" "$WP_SSH" "rm -f /tmp/uploads-${STAMP}.tar.gz /tmp/themes-${STAMP}.tar.gz /tmp/db-${STAMP}.sql.gz /tmp/wp-config-${STAMP}.php"

echo "[wp-backup] Done. Files saved under $OUTDIR"

