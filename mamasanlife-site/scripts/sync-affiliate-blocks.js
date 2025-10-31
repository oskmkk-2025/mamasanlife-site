#!/usr/bin/env node
/**
 * Restore affiliate call-to-action buttons from a WordPress WXR export.
 * The script scans each published post in the XML, extracts known affiliate links,
 * and writes them into Sanity's `affiliateBlocks` field so the frontend can render
 * consistent buttons automatically.
 *
 * Requirements:
 *   - SANITY_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID)
 *   - SANITY_DATASET (defaults to `production`)
 *   - SANITY_WRITE_TOKEN (or SANITY_SESSION_TOKEN)
 *
 * Usage:
 *   node scripts/sync-affiliate-blocks.js --file ../WordPress.2025-10-08.xml --limit 3
 *
 * Options:
 *   --file / -f           Path (relative or absolute) to the WXR XML file.
 *   --dataset             Sanity dataset (default: env SANITY_DATASET or `production`).
 *   --project             Sanity project ID (default: env SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_PROJECT_ID).
 *   --token               Sanity write token (default: env SANITY_WRITE_TOKEN / SANITY_SESSION_TOKEN).
 *   --limit               Max number of buttons per post (default 0 = unlimited).
 *   --networks            Comma-separated allowlist of affiliate networks (default: amazon,rakuten,a8,moshimo,valuecommerce,yahoo,afb).
 *   --mode                `replace` (default) overwrites existing blocks, `append` merges with existing.
 *   --dry-run             If present, no changes are written; a summary is printed instead.
 *   --concurrency         Number of parallel Sanity updates (default: 4).
 */

const fs = require('fs')
const path = require('path')
const pLimit = require('p-limit').default
const { XMLParser } = require('fast-xml-parser')
const cheerio = require('cheerio')
const { createClient } = require('@sanity/client')

loadEnvDefaults()

const DEFAULT_FILE = '../WordPress.2025-10-08.xml'
const DEFAULT_LIMIT = 0 // 0 = no limit
const DEFAULT_MODE = 'replace'
const DEFAULT_NETWORKS = ['amazon', 'rakuten', 'a8', 'moshimo', 'valuecommerce', 'yahoo', 'afb']

const MATCHERS = {
  amazon: [/amazon\.co\.jp/i, /amzn\.to\//i, /amazon-adsystem/i],
  rakuten: [/hb\.afl\.rakuten\.co\.jp/i, /affiliate\.rakuten\.co\.jp/i, /item\.rakuten\.co\.jp/i, /a\.r10\.to\//i],
  a8: [/a8\.net\//i, /px\.a8\.net\//i, /as\.a8\.net\//i, /rpx\.a8\.net\//i],
  moshimo: [/moshimo\.com\//i, /af\.moshimo\.com\//i, /c\.af\.moshimo\.com\//i],
  valuecommerce: [/ck\.jp\.ap\.valuecommerce\.com/i, /ac\.valuecommerce\.com/i],
  yahoo: [/ck\.yahoo\.co\.jp/i, /shopping\.yahoo\.co\.jp/i, /travel\.yahoo\.co\.jp/i],
  afb: [/affiliate-b\.com/i, /t\.afi-b\.com/i],
  others: []
}

const NETWORK_LABELS = {
  amazon: 'Amazonで詳細をみる',
  rakuten: '楽天市場で詳細をみる',
  yahoo: 'Yahoo!で詳細をみる',
  a8: '公式サイトでチェック',
  moshimo: '公式サイトでチェック',
  valuecommerce: '公式サイトでチェック',
  afb: '公式サイトでチェック',
  others: '詳細をみる'
}

function parseArgs(argv) {
  const args = {
    file: DEFAULT_FILE,
    dataset: process.env.SANITY_DATASET || 'production',
    project: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN,
    limit: DEFAULT_LIMIT,
    mode: DEFAULT_MODE,
    networks: DEFAULT_NETWORKS,
    dryRun: false,
    concurrency: 4
  }
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--file' || arg === '-f') args.file = argv[++i]
    else if (arg === '--dataset') args.dataset = argv[++i]
    else if (arg === '--project') args.project = argv[++i]
    else if (arg === '--token') args.token = argv[++i]
    else if (arg === '--limit') {
      const raw = parseInt(argv[++i], 10)
      args.limit = Number.isFinite(raw) ? raw : DEFAULT_LIMIT
    }
    else if (arg === '--networks') args.networks = argv[++i].split(',').map(s => s.trim()).filter(Boolean)
    else if (arg === '--mode') args.mode = (argv[++i] || DEFAULT_MODE).toLowerCase()
    else if (arg === '--dry-run' || arg === '--dryrun') args.dryRun = true
    else if (arg === '--concurrency') args.concurrency = Math.max(1, parseInt(argv[++i], 10) || 4)
  }
  if (!args.file) args.file = DEFAULT_FILE
  if (!args.project) throw new Error('Sanity project ID not provided. Set SANITY_PROJECT_ID or use --project.')
  if (!args.token && !args.dryRun) {
    throw new Error('Sanity write token missing. Set SANITY_WRITE_TOKEN or run with --dry-run.')
  }
  if (!Array.isArray(args.networks) || !args.networks.length) args.networks = DEFAULT_NETWORKS
  if (!Number.isFinite(args.limit)) args.limit = DEFAULT_LIMIT
  if (!['replace', 'append'].includes(args.mode)) args.mode = DEFAULT_MODE
  return args
}

function loadEnvDefaults() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '..', '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env')
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      applyEnvFile(candidate)
    }
  }
}

function applyEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/)
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const cleaned = line.replace(/^export\s+/, '')
      const eqIndex = cleaned.indexOf('=')
      if (eqIndex === -1) continue
      const key = cleaned.slice(0, eqIndex).trim()
      if (!key || process.env[key] !== undefined) continue
      let value = cleaned.slice(eqIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  } catch {
    // Ignore errors from unreadable env files
  }
}

function resolveFilePath(inputPath) {
  const baseDir = process.cwd().replace(/\\/g, '/')
  const basename = path.basename(inputPath)
  const candidates = [
    path.resolve(baseDir, inputPath),
    path.resolve(baseDir, '..', inputPath),
    path.resolve(baseDir, '../..', inputPath),
    path.resolve(baseDir, basename),
    path.resolve(baseDir, '..', basename),
    path.resolve(baseDir, '../..', basename)
  ]
  const found = candidates.find(fs.existsSync)
  if (!found) throw new Error(`WXR file not found. Tried: ${candidates.join(' | ')}`)
  return found
}

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function slugify(input = '') {
  return String(input)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function detectNetwork(href, allowSet) {
  for (const [network, matchers] of Object.entries(MATCHERS)) {
    if (!allowSet.has(network)) continue
    if (matchers.some(rx => rx.test(href))) return network
  }
  return allowSet.has('others') ? 'others' : null
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildButtonHtml({ href, label, network }) {
  const safeHref = escapeHtml(href)
  const safeLabel = escapeHtml(label || NETWORK_LABELS[network] || NETWORK_LABELS.others)
  const networkClass = network ? ` affiliate-btn--${network}` : ''
  return `<a class="affiliate-btn${networkClass}" href="${safeHref}" target="_blank" rel="noopener noreferrer nofollow sponsored">${safeLabel}</a>`
}

function extractAffiliateButtons(html, limit, allowSet) {
  if (!html) return []
  const $ = cheerio.load(String(html), { decodeEntities: false })
  const buttons = []
  const seen = new Set()
  const maxButtons = limit > 0 ? limit : Infinity

  function considerButton(opts) {
    if (!opts?.href) return
    if (buttons.length >= maxButtons) return
    const normalizedHref = String(opts.href).trim()
    if (!normalizedHref) return
    if (seen.has(normalizedHref)) return
    seen.add(normalizedHref)
    const label = (opts.label || '').replace(/\s+/g, ' ').trim() || NETWORK_LABELS[opts.network] || NETWORK_LABELS.others
    const htmlBtn = buildButtonHtml({ href: normalizedHref, label, network: opts.network })
    buttons.push({ html: htmlBtn })
  }

  $('a').each((_, element) => {
    if (buttons.length >= maxButtons) return false
    const el = $(element)
    const href = (el.attr('href') || '').trim()
    if (!href) return
    const network = detectNetwork(href, allowSet)
    if (!network) return
    let label = el.text().replace(/\s+/g, ' ').trim()
    if (!label) {
      const imgAlt = el.find('img[alt]').first().attr('alt')
      if (imgAlt) label = String(imgAlt)
    }
    considerButton({ href, label, network })
  })

  return buttons.slice(0, maxButtons)
}

function dedupeBlocks(blocks) {
  const seen = new Set()
  const result = []
  for (const block of blocks || []) {
    if (!block || typeof block !== 'object') continue
    const html = String(block.html || '').trim()
    const title = block.title ? String(block.title).trim() : ''
    const note = block.note ? String(block.note).trim() : ''
    const key = `${html}|||${title}|||${note}`
    if (!html && !title && !note) continue
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ ...block, html, title, note })
  }
  return result
}

function blocksEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] || {}
    const bi = b[i] || {}
    if ((ai.html || '').trim() !== (bi.html || '').trim()) return false
    if ((ai.title || '').trim() !== (bi.title || '').trim()) return false
    if ((ai.note || '').trim() !== (bi.note || '').trim()) return false
  }
  return true
}

async function main() {
  const args = parseArgs(process.argv)
  const filePath = resolveFilePath(args.file)
  const xmlRaw = fs.readFileSync(filePath, 'utf8')
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', textNodeName: 'text', trimValues: false })
  const json = parser.parse(xmlRaw)
  const items = toArray((((json || {}).rss || {}).channel || {}).item).filter(Boolean)
  if (!items.length) throw new Error('No <item> nodes found in WXR file.')

  const allowSet = new Set(args.networks.map(n => n.toLowerCase()))
  const client = createClient({
    projectId: args.project,
    dataset: args.dataset,
    apiVersion: '2025-09-01',
    token: args.token,
    useCdn: false
  })

  const limit = pLimit(args.concurrency)
  let processed = 0
  let updated = 0
  let skipped = 0
  const details = []

  await Promise.all(items.map(item => limit(async () => {
    try {
      if (item['wp:post_type'] !== 'post') return
      if (item['wp:status'] !== 'publish') return

      const title = (item.title && item.title.text) || item.title || ''
      const postName = String(item['wp:post_name'] || '').trim()
      const slugA = slugify(postName || '')
      const slugB = slugify(title)
      const slug = slugA || slugB
      if (!slug) return

      const doc = await client.fetch(
        "*[_type=='post' && defined(slug.current) && slug.current==$slug][0]{ _id, affiliateBlocks }",
        { slug }
      ).catch(() => null)

      if (!doc?._id) {
        details.push({ slug, status: 'not-found' })
        skipped++
        return
      }

      const contentHtml =
        (item['content:encoded'] && item['content:encoded'].text) ||
        item['content:encoded'] ||
        ''

      const extracted = extractAffiliateButtons(contentHtml, args.limit, allowSet)
      const existing = Array.isArray(doc.affiliateBlocks) ? dedupeBlocks(doc.affiliateBlocks) : []

      if (!extracted.length) {
        details.push({ slug, status: 'no-affiliate', existing: existing.length })
        skipped++
        return
      }

      const nextBlocksRaw = args.mode === 'append'
        ? dedupeBlocks([...existing, ...extracted])
        : dedupeBlocks(extracted)

      if (blocksEqual(existing, nextBlocksRaw)) {
        details.push({ slug, status: 'unchanged', count: existing.length })
        skipped++
        return
      }

      if (!args.dryRun) {
        await client.patch(doc._id).set({ affiliateBlocks: nextBlocksRaw }).commit()
      }

      updated++
      processed++
      details.push({
        slug,
        status: args.dryRun ? 'dry-run' : args.mode === 'append' ? 'appended' : 'replaced',
        previous: existing.length,
        next: nextBlocksRaw.length
      })
    } catch (error) {
      details.push({ slug: (item['wp:post_name'] || item.title || 'unknown'), status: 'error', message: error?.message || String(error) })
      skipped++
    }
  })))

  const summary = {
    file: filePath,
    totalItems: items.length,
    processed,
    updated,
    skipped,
    mode: args.mode,
    limit: args.limit <= 0 ? 'unlimited' : args.limit,
    dryRun: args.dryRun,
    networks: Array.from(allowSet)
  }

  console.log(JSON.stringify({ summary, details }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
