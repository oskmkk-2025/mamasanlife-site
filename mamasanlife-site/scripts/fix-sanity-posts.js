#!/usr/bin/env node
/**
 * Sanity投稿のPortable Text配列に_missing_な _key を補完し、
 * 旧WordPress由来フィールド（categories / mainImage）を削除するメンテナンススクリプト。
 *
 * 使い方:
 *   node scripts/fix-sanity-posts.js
 *   node scripts/fix-sanity-posts.js --dry-run  # 実際には書き込まず内容だけ確認
 *
 * 必要な環境変数:
 *   - SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_PROJECT_ID
 *   - SANITY_DATASET / NEXT_PUBLIC_SANITY_DATASET
 *   - SANITY_WRITE_TOKEN or SANITY_SESSION_TOKEN
 */

const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')
const { createClient } = require('@sanity/client')

function loadEnvLocal() {
  const candidates = [
    path.join(__dirname, '..', '.env.local'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '..', '.env.local')
  ]
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue
    const txt = fs.readFileSync(filePath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const s = line.trim()
      if (!s || s.startsWith('#')) continue
      const eq = s.indexOf('=')
      if (eq === -1) continue
      const key = s.slice(0, eq).trim()
      let value = s.slice(eq + 1).trim().replace(/^"+|"+$/g, '')
      if (!(key in process.env)) process.env[key] = value
    }
    break
  }
}

loadEnvLocal()

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2025-09-01'
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || process.env.SANITY_AUTH_TOKEN
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dryrun')

if (!projectId) throw new Error('SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_PROJECT_ID が未設定です。')
if (!token) throw new Error('書き込み用トークンが必要です (SANITY_WRITE_TOKEN など)。')

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

async function main() {
  const posts = await client.fetch(`*[_type == "post"]{_id, body, categories, mainImage}`)
  let patched = 0
  for (const doc of posts) {
    const { value: nextBody, mutated } = ensurePortableTextKeys(doc.body || [])
    const unsetFields = []
    if (doc.categories) unsetFields.push('categories')
    if (doc.mainImage) unsetFields.push('mainImage')
    if (!mutated && !unsetFields.length) continue

    if (dryRun) {
      console.log('[dry-run] would patch', doc._id, { updateBody: mutated, unsetFields })
      continue
    }

    let patch = client.patch(doc._id)
    if (mutated) patch = patch.set({ body: nextBody })
    if (unsetFields.length) patch = patch.unset(unsetFields)
    await patch.commit()
    patched++
    console.log('[patched]', doc._id, { updatedBody: mutated, removed: unsetFields })
  }

  console.log(`Done. Patched ${patched} documents${dryRun ? ' (dry-run)' : ''}.`)
}

function ensurePortableTextKeys(value, inArray = true) {
  if (Array.isArray(value)) {
    let mutated = false
    const next = value.map((item) => {
      const { value: child, mutated: childMutated } = ensurePortableTextKeys(item, true)
      if (childMutated) mutated = true
      return child
    })
    return { value: mutated ? next : value, mutated }
  }
  if (value && typeof value === 'object') {
    let mutated = false
    let next = value
    if (inArray && next._type && !next._key) {
      next = { ...next, _key: randomPortableTextKey() }
      mutated = true
    }
    for (const key of Object.keys(next)) {
      if (key === '_key') continue
      const { value: child, mutated: childMutated } = ensurePortableTextKeys(next[key], false)
      if (childMutated) {
        if (!mutated) {
          next = next === value ? { ...next } : next
          mutated = true
        }
        next[key] = child
      }
    }
    return { value: next, mutated }
  }
  return { value, mutated: false }
}

function randomPortableTextKey() {
  return randomUUID().replace(/-/g, '').slice(0, 12)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
