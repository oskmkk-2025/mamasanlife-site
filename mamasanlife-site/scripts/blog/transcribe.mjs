#!/usr/bin/env node
// 音声ファイルを文字起こしする（whisper.cpp・完全ローカル・無料）
// 使い方: node scripts/blog/transcribe.mjs --audio ~/Downloads/ep1.m4a [--out transcript.txt]
// 前提: brew install whisper-cpp 済み・モデルは ~/.whisper/ggml-small.bin
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const opts = {}
const rest = process.argv.slice(2)
for (let i = 0; i < rest.length; i += 2) opts[rest[i]] = rest[i + 1]
if (!opts['--audio']) { console.error('使い方: transcribe.mjs --audio <file> [--out <txt>]'); process.exit(1) }

const audio = opts['--audio'].replace(/^~\//, os.homedir() + '/')
const model = path.join(os.homedir(), '.whisper/ggml-small.bin')
if (!fs.existsSync(audio)) { console.error(`音声が見つかりません: ${audio}`); process.exit(1) }
if (!fs.existsSync(model)) { console.error(`whisperモデルがありません: ${model}\ncurl -L -o ~/.whisper/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin`); process.exit(1) }

const out = opts['--out'] || audio.replace(/\.\w+$/, '') + '-transcript.txt'
const tmpWav = path.join(os.tmpdir(), `transcribe-${Date.now()}.wav`)

// macOS標準のafconvertで 16kHzモノラルWAV に変換（whisper.cppの入力要件）
console.log('WAVに変換中...')
execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@16000', '-c', '1', audio, tmpWav])

console.log('文字起こし中（数分かかります）...')
const base = out.replace(/\.txt$/, '')
execFileSync('whisper-cli', ['-m', model, '-l', 'ja', '-f', tmpWav, '--output-txt', '--output-file', base], {
  stdio: ['ignore', 'ignore', 'inherit'],
})
fs.unlinkSync(tmpWav)

console.log(`完了: ${out}（${fs.readFileSync(out, 'utf8').length}文字）`)
