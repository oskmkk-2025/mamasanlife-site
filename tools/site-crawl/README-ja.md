# wget スパイダでURL網羅取得（200/301/404 抽出）

このディレクトリの `wget-spider.sh` は、`wget --spider` を使ってサイト内リンクを最大3階層まで巡回し、
以下の成果物を `backups/` 配下に出力します。

- `wget-spider.log` ・・・生ログ
- `url-crawled.txt` ・・・クロールしたURL一覧（ユニーク）
- `url-crawl.log` ・・・200/301/404/リダイレクト矢印を抽出
- `404-list.txt` ・・・404候補のURL一覧

## 事前条件
- macOS（Homebrew 利用を想定）
- `wget` が無い場合は Homebrew で `wget` をインストール

## 使い方

```
# 1) 実行権限を付与
chmod +x tools/site-crawl/wget-spider.sh

# 2) 実行（サイトルートを指定）
TOOLS_ROOT="/Users/makiko/GPT-codexProjects" \
  bash tools/site-crawl/wget-spider.sh \
  "https://mamasanmoney-bu.com/" \
  "$TOOLS_ROOT/backups"
```

> wget が無い場合は、スクリプトがインストール手順を表示します。

