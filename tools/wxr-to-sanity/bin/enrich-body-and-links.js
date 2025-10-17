#!/usr/bin/env node
/*
  Enrich Sanity posts' body from WXR HTML: preserve inline images and internal links.

  What it does:
    - Parse WXR XML and build a map: WP <link> URL and guid -> imported Sanity post slug/_id
    - For each post: convert its HTML body to Portable Text blocks with:
        * <img> → {_type:'image', asset:{_ref:...}} (uploads image assets to Sanity)
        * <a>  → link markDefs; internal links rewritten to '/<slug>' path
    - Patch 'post' documents' body if changed

  Usage examples:
    node bin/enrich-body-and-links.js --dataset staging --project <id> --input ../../WordPress.2025-08-19.xml --dry-run
    node bin/enrich-body-and-links.js --dataset production --project <id> --input ../../WordPress.2025-08-19.xml

  Auth:
    - Provide write token via env: SANITY_AUTH_TOKEN (or run via `sanity exec --with-user-token`)
*/

const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit').default;
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@sanity/client');
const crypto = require('crypto');

function parseArgs(argv) {
  const args = {
    dataset: 'staging',
    project: process.env.SANITY_PROJECT_ID || null,
    token: process.env.SANITY_AUTH_TOKEN || process.env.SANITY_SESSION_TOKEN || null,
    input: path.join(process.cwd(), 'WordPress.2025-08-19.xml'),
    baseDomain: null, // auto-detect from <channel><link>
    dryRun: false,
    concurrency: 3,
    maxPosts: null,
    verbose: false,
    allowExternalImages: false,
    denyHosts: [],
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset') args.dataset = argv[++i];
    else if (a === '--project') args.project = argv[++i];
    else if (a === '--token') args.token = argv[++i];
    else if (a === '--input' || a === '-i') args.input = argv[++i];
    else if (a === '--base-domain') args.baseDomain = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--concurrency') args.concurrency = parseInt(argv[++i], 10) || 3;
    else if (a === '--max-posts') args.maxPosts = parseInt(argv[++i], 10) || null;
    else if (a === '--allow-external-images') args.allowExternalImages = true;
    else if (a === '--deny-host') args.denyHosts.push(argv[++i]);
    else if (a === '--verbose' || a === '-v') args.verbose = true;
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
  }
  if (!args.project) {
    console.error('[enrich] --project <id> is required (or set SANITY_PROJECT_ID).');
    process.exit(1);
  }
  return args;
}

function printHelp() {
  console.log(`\nUsage: enrich-body-and-links --dataset <name> --project <id> --input <wxr.xml> [options]\n\nOptions:\n  --dataset <name>        Target dataset (default: staging)\n  --project <id>          Sanity projectId\n  --token <token>         Write token (fallback: SANITY_AUTH_TOKEN)\n  --input, -i <file>      WXR XML file (default: ./WordPress.2025-08-19.xml)\n  --base-domain <host>    Force WordPress domain if auto-detect fails\n  --dry-run               No writes/uploads; show planned changes\n  --concurrency <n>       Concurrent ops (default: 3)\n  --max-posts <n>         Limit number of posts (for testing)\n`);
}

function readXml(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function unifyArray(val) {
  if (val === undefined || val === null) return [];
  return Array.isArray(val) ? val : [val];
}

function slugify(input) {
  if (!input) return '';
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function detectBaseDomain(json) {
  try {
    const link = (((json || {}).rss || {}).channel || {}).link;
    const url = (typeof link === 'string' ? link : link && link.text) || '';
    const m = String(url).match(/^https?:\/\/([^\/]+)/i);
    return m ? m[1] : null;
  } catch { return null; }
}

function buildPostIndex(json) {
  const items = unifyArray((((json || {}).rss || {}).channel || {}).item);
  const posts = [];
  const urlToSlug = new Map();
  for (const it of items) {
    if (!it || it['wp:post_type'] !== 'post') continue;
    const rawTitle = (it.title && it.title.text) || it.title || '';
    const title = String(rawTitle).trim();
    const slug = slugify(it['wp:post_name'] || title);
    const link = (it.link && it.link.text) || it.link || null;
    const guid = (it.guid && it.guid.text) || it.guid || null;
    const html = (it['content:encoded'] && it['content:encoded'].text) || it['content:encoded'] || '';
    const wpId = (it['wp:post_id'] || '').toString();
    const entry = { slug, link, guid, html, wpId };
    posts.push(entry);
    if (link) urlToSlug.set(String(link).trim(), slug);
    if (guid) urlToSlug.set(String(guid).trim(), slug);
  }
  return { posts, urlToSlug };
}

function isInternalUrl(href, baseDomain) {
  if (!href) return false;
  if (/^\//.test(href)) return true;
  try {
    const u = new URL(href, 'https://' + baseDomain);
    return u.hostname.replace(/^www\./, '') === baseDomain.replace(/^www\./, '');
  } catch { return false; }
}

function normInternalPath(href, baseDomain) {
  try {
    if (/^\//.test(href)) return href;
    const u = new URL(href, 'https://' + baseDomain);
    return u.pathname + (u.hash || '');
  } catch { return href; }
}

function extractTokens(html) {
  // 1) Anchor-wrapped images <a ...><img ...></a>
  const tokens = [];
  const reAImg = /<a\s+([^>]*?)>\s*(<img\s+[^>]*?>)\s*<\/a>/gis;
  let last = 0, m;
  while ((m = reAImg.exec(html)) !== null) {
    const before = html.slice(last, m.index);
    if (before) tokens.push({type:'text', html: before});
    const aAttrs = m[1] || '';
    const imgTag = m[2] || '';
    const href = (aAttrs.match(/href\s*=\s*"([^"]+)"/i) || [null,''])[1] || (aAttrs.match(/href\s*=\s*'([^']+)'/i) || [null,''])[1];
    const iAttrs = (imgTag.match(/<img\s+([^>]*?)>/i) || [null,''])[1] || '';
    const src = (iAttrs.match(/src\s*=\s*"([^"]+)"/i) || [null,''])[1] || (iAttrs.match(/src\s*=\s*'([^']+)'/i) || [null,''])[1];
    const alt = (iAttrs.match(/alt\s*=\s*"([^"]*)"/i) || [null,''])[1] || (iAttrs.match(/alt\s*=\s*'([^']*)'/i) || [null,''])[1];
    tokens.push({type:'aimg', src, alt, href});
    last = reAImg.lastIndex;
  }
  const tailAfterAnchors = html.slice(last);
  // 2) Plain <img> inside the remaining
  const reImg = /<img\s+([^>]*?)>/gis;
  let idx = 0, mm;
  while ((mm = reImg.exec(tailAfterAnchors)) !== null) {
    const before = tailAfterAnchors.slice(idx, mm.index);
    if (before) tokens.push({type:'text', html: before});
    const attrs = mm[1] || '';
    const src = (attrs.match(/src\s*=\s*"([^"]+)"/i) || [null,''])[1] || (attrs.match(/src\s*=\s*'([^']+)'/i) || [null,''])[1];
    const alt = (attrs.match(/alt\s*=\s*"([^"]*)"/i) || [null,''])[1] || (attrs.match(/alt\s*=\s*'([^']*)'/i) || [null,''])[1];
    tokens.push({type:'img', src, alt});
    idx = reImg.lastIndex;
  }
  const tail = tailAfterAnchors.slice(idx);
  if (tail) tokens.push({type:'text', html: tail});
  return tokens;
}

function stripHtmlExceptAnchors(html) {
  // Keep <a>...</a>, convert <br> to newline, drop other tags
  let s = String(html || '');
  s = s.replace(/<\s*br\s*\/?>/gi, '\n');
  // Remove captions/shortcodes like [caption]...[/caption]
  s = s.replace(/\[[^\]]*\][^\[]*\/?\[[^\]]*\]/g, ' ');
  // Remove all tags except <a>
  s = s.replace(/<(?!a\b)(\/)?[^>]*>/gi, '');
  return s;
}

function buildBlockFromTextHtml(html, urlToSlug, baseDomain) {
  const cleaned = stripHtmlExceptAnchors(html);
  const reA = /<a\s+([^>]*?)>(.*?)<\/a>/gis;
  let last = 0, m;
  const children = [];
  const markDefs = [];
  let lastHrefKey = null;
  while ((m = reA.exec(cleaned)) !== null) {
    const before = cleaned.slice(last, m.index);
    if (before) children.push({_type:'span', text: decodeEntities(before), marks: []});
    const attrs = m[1] || '';
    const innerHtml = m[2] || '';
    const text = decodeEntities(innerHtml.replace(/<[^>]*>/g, '')); // strip inner tags
    const href = (attrs.match(/href\s*=\s*"([^"]+)"/i) || [null, ''])[1] || (attrs.match(/href\s*=\s*'([^']+)'/i) || [null, ''])[1];
    let outHref = href || '';
    if (href && baseDomain && isInternalUrl(href, baseDomain)) {
      const pathOnly = normInternalPath(href, baseDomain);
      // Try to map full URL first
      const full = href.startsWith('http') ? href : `https://${baseDomain}${pathOnly}`;
      const slug = urlToSlug.get(full) || urlToSlug.get(`http://${baseDomain}${pathOnly}`);
      if (slug) outHref = `/${slug}`;
      else outHref = pathOnly; // fallback to path
    }
    const key = 'm' + (markDefs.length + 1);
    markDefs.push({_key: key, _type: 'link', href: outHref});
    children.push({_type:'span', text: text || outHref, marks: [key]});
    lastHrefKey = key;
    last = reA.lastIndex;
  }
  const tail = cleaned.slice(last);
  if (tail) children.push({_type:'span', text: decodeEntities(tail), marks: []});
  if (children.length === 0) return null;
  const singleAnchor = children.length === 1 && markDefs.length === 1 && (children[0].marks || []).includes(lastHrefKey || '');
  if (singleAnchor) {
    const href = (markDefs[0] && markDefs[0].href) || '';
    let slug = '';
    try {
      if (href.startsWith('/')) slug = href.replace(/^\//,'');
      else { const u = new URL(href); slug = (u.pathname||'/').replace(/^\//,'').replace(/\/$/,''); }
    } catch {}
    return { _type:'blogCard', href, slug };
  }
  return { _type:'block', style:'normal', markDefs, children };
}

function buildBlocksFromTextWithLists(html, urlToSlug, baseDomain) {
  const blocks = [];
  // Detect common button wrappers and extract as buttonLink blocks first
  const reBtn = /<div[^>]*class="[^"]*(btn|button)[^"]*"[^>]*>[\s\S]*?<a\s+[^>]*href=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/div>/gi;
  let btnLast = 0, bm;
  const segments = [];
  while ((bm = reBtn.exec(html)) !== null) {
    const before = html.slice(btnLast, bm.index);
    if (before) segments.push({type:'text', html: before});
    const href = bm[2] || '';
    const label = String(bm[3]||'').replace(/<[^>]*>/g,'').trim();
    segments.push({type:'button', href, label});
    btnLast = reBtn.lastIndex;
  }
  const afterBtn = html.slice(btnLast);
  if (afterBtn) segments.push({type:'text', html: afterBtn});

  for (const seg of segments) {
    if (seg.type === 'button') {
      let hrefOut = seg.href || '';
      if (hrefOut && baseDomain && isInternalUrl(hrefOut, baseDomain)) {
        const pathOnly = normInternalPath(hrefOut, baseDomain);
        const full = hrefOut.startsWith('http') ? hrefOut : `https://${baseDomain}${pathOnly}`;
        const mapped = urlToSlug.get(full) || urlToSlug.get(`http://${baseDomain}${pathOnly}`);
        hrefOut = mapped ? `/${mapped}` : pathOnly;
      }
      blocks.push({_type:'buttonLink', href: hrefOut, label: seg.label});
      continue;
    }
    const txt = seg.html || '';
    // split into headings and lists
    const reSec = /<(h[2-5])[^>]*>([\s\S]*?)<\/\1>|<(ul|ol)[^>]*>([\s\S]*?)<\/\3>/gi;
    let last = 0, m;
    while ((m = reSec.exec(txt)) !== null) {
      const before = txt.slice(last, m.index);
      if (before) {
        const b = buildBlockFromTextHtml(before, urlToSlug, baseDomain);
        if (b && (b.children?.length||0)>0) blocks.push(b);
      }
      if (m[1]) {
        const tag = m[1].toLowerCase();
        const inner = m[2] || '';
        const b = buildBlockFromTextHtml(inner, urlToSlug, baseDomain);
        if (b) { if (b._type==='block') b.style = tag; blocks.push(b); }
      } else if (m[3]) {
        const listTag = m[3].toLowerCase();
        const listHtml = m[4] || '';
        const reLi = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let lm;
        while ((lm = reLi.exec(listHtml)) !== null) {
          const liHtml = lm[1] || '';
          const b = buildBlockFromTextHtml(liHtml, urlToSlug, baseDomain);
          if (b && (b.children?.length||0)>0) { if (b._type==='block') b.listItem = listTag==='ol'?'number':'bullet'; blocks.push(b); }
        }
      }
      last = reSec.lastIndex;
    }
    const tail = txt.slice(last);
    if (tail) { const b = buildBlockFromTextHtml(tail, urlToSlug, baseDomain); if (b && (b.children?.length||0)>0) blocks.push(b); }
  }
  return blocks;
}

function decodeEntities(s) {
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function normalizeImageUrl(src, baseDomain) {
  if (!src) return '';
  let s = String(src).trim();
  if (s.startsWith('//')) return 'https:' + s;
  if (s.startsWith('/')) return baseDomain ? `https://${baseDomain}${s}` : s;
  return s;
}

const DEFAULT_DENY_HOSTS = new Set([
  'ad.jp.ap.valuecommerce.com',
  'px.a8.net',
  'www19.a8.net',
  'hbb.afl.rakuten.co.jp',
  'hb.afl.rakuten.co.jp',
  'blog.with2.net',
  'b.blogmura.com',
  'googleads.g.doubleclick.net',
  'ad.doubleclick.net',
  'img.ak.impact-ad.jp',
]);

function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
}

function isProbablyTrackingPixel(url) {
  try {
    const u = new URL(url);
    const name = (u.pathname.split('/').pop() || '').toLowerCase();
    if (name === '0.gif' || name === 'pixel.gif') return true;
    if (u.pathname.includes('/gifbanner')) return true;
    return false;
  } catch { return false; }
}

function shouldUploadImage(url, baseDomain, args) {
  const h = hostOf(url);
  if (!h) return false;
  if (DEFAULT_DENY_HOSTS.has(h)) return false;
  if ((args.denyHosts || []).includes(h)) return false;
  if (isProbablyTrackingPixel(url)) return false;
  const isWp = (h === baseDomain || (baseDomain && h.endsWith('.' + baseDomain))) && /\/wp-content\/uploads\//.test(url);
  return args.allowExternalImages ? !isProbablyTrackingPixel(url) : isWp;
}

async function fetchImageBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

function ptEquals(a, b) {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}

async function run() {
  const args = parseArgs(process.argv);
  const tokenRaw = args.token || process.env.SANITY_AUTH_TOKEN || process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || '';
  const token = typeof tokenRaw === 'string' ? tokenRaw.replace(/[^\x21-\x7E]/g, '') : tokenRaw; // strip non-ASCII + spaces/controls
  const client = createClient({
    projectId: args.project,
    dataset: args.dataset,
    token,
    apiVersion: '2025-09-01',
    useCdn: false,
  });

  const xml = readXml(args.input);
  const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:'', textNodeName:'text', trimValues:false });
  const json = parser.parse(xml);
  const baseDomain = args.baseDomain || detectBaseDomain(json);
  if (!baseDomain) console.warn('[enrich] WARN: base domain not detected; internal link rewrite may be limited.');

  const { posts, urlToSlug } = buildPostIndex(json);
  const limited = args.maxPosts ? posts.slice(0, args.maxPosts) : posts;
  const limit = pLimit(args.concurrency);
  const urlAssetCache = new Map(); // url -> assetId
  let updated = 0, skipped = 0, failed = 0;

  await Promise.all(limited.map((p) => limit(async () => {
    try {
      const slug = p.slug;
      if (!slug) { skipped++; return; }
      if (args.verbose) console.log(`[enrich] processing ${slug}`);
      const doc = await client.fetch("*[_type=='post' && slug.current==$slug][0]{_id, slug, body}", {slug});
      if (!doc?._id) { skipped++; return; }

      const tokens = extractTokens(p.html || '');
      const blocks = [];
      for (const t of tokens) {
        if (t.type === 'text') {
          const bs = buildBlocksFromTextWithLists(t.html, urlToSlug, baseDomain);
          for (const bb of bs) if (bb && (bb.children?.length || 0) > 0) blocks.push(bb);
        } else if (t.type === 'img' && t.src) {
          const src = normalizeImageUrl(t.src, baseDomain);
          if (!src || !shouldUploadImage(src, baseDomain, args)) continue;
          if (args.dryRun) {
            blocks.push({_type:'image', asset:{_type:'reference', _ref:'asset-upload-would-happen'}, alt: t.alt || ''});
          } else {
            try {
              let assetId = urlAssetCache.get(src);
              if (!assetId) {
                const buf = await fetchImageBuffer(src);
                const filename = path.basename(new URL(src).pathname) || 'image.jpg';
                const asset = await client.assets.upload('image', buf, {filename});
                assetId = asset._id; urlAssetCache.set(src, assetId);
              }
              blocks.push({_type:'image', asset:{_type:'reference', _ref: assetId}, alt: t.alt || ''});
            } catch (e) {
              console.warn(`[enrich] image upload failed for ${slug}: ${src} → ${e.message}`);
            }
          }
        } else if (t.type === 'aimg' && t.src) {
          const src = normalizeImageUrl(t.src, baseDomain);
          let hrefOut = t.href || '';
          if (hrefOut && baseDomain && isInternalUrl(hrefOut, baseDomain)) {
            const pathOnly = normInternalPath(hrefOut, baseDomain);
            const full = hrefOut.startsWith('http') ? hrefOut : `https://${baseDomain}${pathOnly}`;
            const mapped = urlToSlug.get(full) || urlToSlug.get(`http://${baseDomain}${pathOnly}`);
            hrefOut = mapped ? `/${mapped}` : pathOnly;
          }
          if (!src || !shouldUploadImage(src, baseDomain, args)) continue;
          if (args.dryRun) {
            blocks.push({_type:'image', asset:{_type:'reference', _ref:'asset-upload-would-happen'}, alt: t.alt || '', href: hrefOut});
          } else {
            try {
              let assetId = urlAssetCache.get(src);
              if (!assetId) {
                const buf = await fetchImageBuffer(src);
                const filename = path.basename(new URL(src).pathname) || 'image.jpg';
                const asset = await client.assets.upload('image', buf, {filename});
                assetId = asset._id; urlAssetCache.set(src, assetId);
              }
              blocks.push({_type:'image', asset:{_type:'reference', _ref: assetId}, alt: t.alt || '', href: hrefOut});
            } catch (e) {
              console.warn(`[enrich] image upload failed for ${slug}: ${src} → ${e.message}`);
            }
          }
        }
      }

      if (blocks.length === 0) { skipped++; return; }
      if (ptEquals(blocks, doc.body)) { skipped++; return; }

      if (args.dryRun) {
        console.log(`[dry-run] would patch ${doc._id}: body blocks=${blocks.length}`);
        updated++;
        return;
      }
      await client.patch(doc._id).set({ body: blocks }).commit();
      if (args.verbose) console.log(`[enrich] patched ${doc._id} blocks=${blocks.length}`);
      updated++;
    } catch (e) {
      failed++;
      console.warn('[enrich] failed:', e.message);
    }
  })));

  console.log(`[enrich] Completed. updated=${updated}, skipped=${skipped}, failed=${failed} (dataset=${args.dataset})`);
}

run().catch((err) => { console.error('[enrich] ERROR:', err); process.exit(1); });
