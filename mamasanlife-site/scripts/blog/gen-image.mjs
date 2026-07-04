#!/usr/bin/env node
// Gemini (Nano Banana) で画像を生成する
// 使い方:
//   node scripts/blog/gen-image.mjs --prompt "プロンプト" --out out.png [--ref 参考画像.png]...
//   node scripts/blog/gen-image.mjs --preset hero --topic "ふるさと納税" --out hero.png
// APIキーの置き場所（どれか1つ）:
//   1) 環境変数 GEMINI_API_KEY
//   2) ~/.gemini/.env に GEMINI_API_KEY=xxxx
// キーの作り方: https://aistudio.google.com/apikey を開いて「APIキーを作成」を押すだけ（無料）
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const MODEL = 'gemini-2.5-flash-image'

function resolveKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim()
  try {
    const env = fs.readFileSync(path.join(os.homedir(), '.gemini/.env'), 'utf8')
    const m = env.match(/^GEMINI_API_KEY=(.+)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  } catch { }
  console.error('GEMINI_API_KEYが見つかりません。')
  console.error('作り方: https://aistudio.google.com/apikey → 「APIキーを作成」→ 出てきた文字列を')
  console.error(`  ~/.gemini/.env に「GEMINI_API_KEY=キー」という1行で保存（AIに渡せば保存も代行します）`)
  process.exit(1)
}

// アイキャッチ（ヒーロー画像）のハウススタイル: 既存記事のペーパークラフト調に合わせる
const PRESETS = {
  hero: (topic) => `Paper craft style illustration about "${topic}". Handcrafted layered paper art,
soft pastel colors, cream/off-white background, gentle shadows between paper layers,
cute and warm Japanese lifestyle blog aesthetic. No people faces, no text, no letters,
no watermark. Wide 16:9 composition, main motif centered.`,
}

const args = process.argv.slice(2)
const opts = { refs: [] }
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ref') opts.refs.push(args[++i])
  else if (args[i] === '--prompt') opts.prompt = args[++i]
  else if (args[i] === '--prompt-file') opts.prompt = fs.readFileSync(args[++i], 'utf8')
  else if (args[i] === '--preset') opts.preset = args[++i]
  else if (args[i] === '--topic') opts.topic = args[++i]
  else if (args[i] === '--out') opts.out = args[++i]
}
if (opts.preset && PRESETS[opts.preset]) opts.prompt = PRESETS[opts.preset](opts.topic || '')
if (!opts.prompt || !opts.out) {
  console.error('使い方: gen-image.mjs --prompt "..." --out out.png [--ref img.png] | --preset hero --topic "..." --out out.png')
  process.exit(1)
}

const key = resolveKey()
const parts = [{ text: opts.prompt }]
for (const r of opts.refs) {
  const mime = r.endsWith('.jpg') || r.endsWith('.jpeg') ? 'image/jpeg' : 'image/png'
  parts.push({ inline_data: { mime_type: mime, data: fs.readFileSync(r).toString('base64') } })
}

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  }),
})
if (!res.ok) {
  console.error(`API エラー ${res.status}: ${(await res.text()).slice(0, 500)}`)
  process.exit(1)
}
const data = await res.json()
const img = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data)
if (!img) {
  console.error('画像が返ってきませんでした:', JSON.stringify(data).slice(0, 400))
  process.exit(1)
}
fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true })
fs.writeFileSync(opts.out, Buffer.from(img.inlineData.data, 'base64'))
console.log(`生成完了: ${opts.out}`)
