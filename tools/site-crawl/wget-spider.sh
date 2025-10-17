#!/usr/bin/env bash
set -euo pipefail

ROOT_URL=${1:-}
OUT_DIR=${2:-}
if [[ -z "${ROOT_URL}" || -z "${OUT_DIR}" ]]; then
  echo "Usage: bash tools/site-crawl/wget-spider.sh <root_url> <out_dir>" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"
LOG="${OUT_DIR}/wget-spider.log"
LIST="${OUT_DIR}/url-crawled.txt"
FILTERED="${OUT_DIR}/url-crawl.log"
LIST404="${OUT_DIR}/404-list.txt"

# Detect wget
WGET_BIN="$(command -v wget || true)"
if [[ -z "${WGET_BIN}" ]]; then
  # Try common Homebrew locations
  for p in /opt/homebrew/bin/wget /usr/local/bin/wget; do
    if [[ -x "$p" ]]; then WGET_BIN="$p"; break; fi
  done
fi

if [[ -z "${WGET_BIN}" ]]; then
  cat >&2 <<EOS
[wget-spider] ERROR: wget が見つかりません。
Homebrew で以下を実行してください:

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv)"
brew install wget

その後、再度このスクリプトを実行してください。
EOS
  exit 2
fi

echo "[wget-spider] Using: ${WGET_BIN}" >&2

"${WGET_BIN}" -r -l 3 -np -k -E -p -e robots=off --spider \
  -o "${LOG}" "${ROOT_URL}"

# Extract URLs and statuses
grep -E "^[[:space:]]+URL:" "${LOG}" | sed -E 's/^[[:space:]]+URL:[[:space:]]+//' | sort -u > "${LIST}" || true
grep -E "( 200 | 301 | 404 | -> )" "${LOG}" > "${FILTERED}" || true

# 404 candidates (best-effort)
awk '
  /^--/ {u=$2}
  / 404 / {print u}
' "${LOG}" | sort -u > "${LIST404}" || true

echo "[wget-spider] Done -> ${OUT_DIR}"
echo "  URLs: $(wc -l < "${LIST}" | tr -d ' ')"
echo "  404 candidates: $(wc -l < "${LIST404}" | tr -d ' ')"

