#!/usr/bin/env node
// マンガを台本から全自動生成する（生成→分割→meta.json作成まで）
// 使い方:
//   node scripts/blog/gen-manga.mjs --dir public/manga/ep3-gemini --scenes ep3-scenes.json
// scenes jsonの形式:
//   { "title": "第3話のタイトル", "targetSlug": "記事slug",
//     "scenes": ["1コマ目の絵の指示", "2コマ目...", "3コマ目...", "4コマ目..."],
//     "captions": ["セリフ1", "セリフ2", "セリフ3", "セリフ4"],
//     "alts": ["alt1", "alt2", "alt3", "alt4"] }
// 完了後: node scripts/blog/add-manga.mjs <targetSlug> --dir <dir> で記事に挿入
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const opts = {}
for (let i = 0; i < args.length; i += 2) opts[args[i]] = args[i + 1]
if (!opts['--dir'] || !opts['--scenes']) {
  console.error('使い方: gen-manga.mjs --dir public/manga/epN-gemini --scenes scenes.json')
  process.exit(1)
}
const spec = JSON.parse(fs.readFileSync(opts['--scenes'], 'utf8'))
if (!Array.isArray(spec.scenes) || spec.scenes.length !== 4) {
  console.error('scenesは4コマ分の配列にしてください'); process.exit(1)
}

const dir = opts['--dir']
fs.mkdirSync(dir, { recursive: true })

// 第1話と同じ画風・キャラで統一するための固定テンプレート（PROMPTS.md準拠）
const prompt = `この画像と同じ画風・同じキャラで、かわいい日本の漫画風の縦読み4コマを、縦長の1枚画像で描いて。
画風: ネイビー（紺色）単色の線画＋淡い青グレーの陰影、白背景、太めのきれいな輪郭線。各コマは細い黒枠で囲み、コマとコマの間に白い余白を入れる。
セリフ・文字・擬音は一切入れない。
登場人物（全員に小さなねこ耳がある）:
・40代の優しいメガネのパパ（ポロシャツ）
・ショートボブで明るい40代のママ（アウトドアベスト）
・ロングヘアでセーラー服の女子高生の姉
・短髪でスポーティな中学生の弟
・キジトラの不機嫌そうな猫
・チャトラの賢そうな猫
1コマ目: ${spec.scenes[0]}
2コマ目: ${spec.scenes[1]}
3コマ目: ${spec.scenes[2]}
4コマ目: ${spec.scenes[3]}`

const scriptDir = path.dirname(new URL(import.meta.url).pathname)
const ref = 'public/manga/ep1-gemini/strip.png'  // 画風アンカー（第1話）
const strip = path.join(dir, 'strip.png')

console.log('1/3 Nano Bananaで生成中...')
execFileSync('node', [path.join(scriptDir, 'gen-image.mjs'),
  '--prompt', prompt, '--ref', ref, '--out', strip], { stdio: 'inherit' })

console.log('2/3 コマ分割中...')
execFileSync('python3', [path.join(scriptDir, 'split-manga.py'), strip, dir], { stdio: 'inherit' })

console.log('3/3 meta.json作成...')
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({
  title: spec.title || '', targetSlug: spec.targetSlug || '',
  alts: spec.alts || spec.captions || [], captions: spec.captions || [],
}, null, 1))

console.log(`完了。次: node scripts/blog/add-manga.mjs ${spec.targetSlug || '<slug>'} --dir ${dir}`)
