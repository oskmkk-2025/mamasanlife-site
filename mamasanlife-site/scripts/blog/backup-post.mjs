#!/usr/bin/env node
// 記事の完全バックアップを backups/posts/ に保存する（編集前に必ず実行）
// 例: node scripts/blog/backup-post.mjs money-forward-me
import fs from 'node:fs'
import path from 'node:path'
import { client } from './lib.mjs'

const slug = process.argv[2]
if (!slug) { console.error('使い方: node scripts/blog/backup-post.mjs <slug>'); process.exit(1) }

const doc = await client().fetch(`*[_type=='post' && slug.current==$slug][0]`, { slug })
if (!doc) { console.error(`記事が見つかりません: ${slug}`); process.exit(1) }

const dir = path.join(process.cwd(), 'backups', 'posts')
fs.mkdirSync(dir, { recursive: true })
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')
const file = path.join(dir, `${slug}-${stamp}.json`)
fs.writeFileSync(file, JSON.stringify(doc, null, 1))
console.log(`バックアップ保存: ${file}`)
