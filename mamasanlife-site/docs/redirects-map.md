# 301 リダイレクト対応表（追記用）

- 旧: `/:year/:month/:slug/` → 新: `/:slug`
- 旧: `/category/:slug` → 新: `/topics/:slug`
- 旧: `/tag/:slug` → 新: `/tags/:slug`
- 旧: `/(.*)/amp` → 新: `/$1`
- 旧: `/index.php/(.*)` → 新: `/$1`

個別例外はこの表に追記し、`vercel.json` の上部に追加してください（上にある行ほど優先）。

| 旧URL | 新URL | 備考 |
|---|---|---|
| /2024/05/old-article/ | /old-article | 例 |
| /category/lifehack | /topics/lifehack | 例 |

