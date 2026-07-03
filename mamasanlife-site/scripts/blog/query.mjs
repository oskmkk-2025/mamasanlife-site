#!/usr/bin/env node
// GROQクエリを実行して結果をJSONで表示する（読み取り専用）
// 例: node scripts/blog/query.mjs "*[_type=='post']{'slug':slug.current,title}"
// 例: node scripts/blog/query.mjs --slug money-forward-me   ← 記事1本の概要を表示
import { client, getPostBySlug } from './lib.mjs'

const args = process.argv.slice(2)
if (!args.length) {
  console.error('使い方: node scripts/blog/query.mjs "<GROQクエリ>" | --slug <slug>')
  process.exit(1)
}

if (args[0] === '--slug') {
  const post = await getPostBySlug(args[1], '{_id, title, seoTitle, seoDescription, "slug": slug.current, category, publishedAt, updatedAt, "blocks": count(body)}')
  console.log(JSON.stringify(post, null, 1))
} else {
  const result = await client().fetch(args[0])
  console.log(JSON.stringify(result, null, 1))
}
