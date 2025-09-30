# 301 リダイレクト対応表（雛形）

下記のように旧WordPress URL から新URLへのパターンを整理し、`vercel.json` の `redirects` に追記してください。上に書いた方が優先されます。

- 旧: `/:year/:month/:slug/` → 新: `/:slug`
- 旧: `/category/:slug` → 新: `/topics/:slug`
- 旧: `/tag/:slug` → 新: `/tags/:slug`
- 旧: `/(.*)/amp` → 新: `/$1`
- 旧: `/index.php/(.*)` → 新: `/$1`

個別例外があれば、ここに列挙して上位に追加します。

| 旧URL | 新URL | 備考 |
|---|---|---|
| /2024/05/old-article/ | /old-article | 例 |
| /category/lifehack | /topics/lifehack | 例 |

