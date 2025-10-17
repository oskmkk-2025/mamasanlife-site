#!/usr/bin/env node
/*
  WXR → Sanity NDJSON converter (minimal)

  - Focus: title/slug/categories/tags/excerpt/publishedAt/updatedAt/body/heroImageUrl
  - Body: convert HTML to plain-text Portable Text (single block)
  - Hero image: resolve via _thumbnail_id → attachment item's wp:attachment_url, store as `heroImageUrl`

  Usage:
    node bin/wxr-to-sanity.js --input /path/to/WordPress.xml [--output out/sanity.ndjson]

  Note:
    This script outputs NDJSON (one JSON document per line) suitable for `sanity dataset import`.
    It does NOT upload image assets. We keep hero image URL in `heroImageUrl` for a later asset import step.
*/

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

function parseArgs(argv) {
  const args = {
    input: null,
    output: path.join(process.cwd(), 'tools/wxr-to-sanity/out/sanity.ndjson'),
    postType: 'post',
    categoryType: 'category',
    tagType: 'tag',
    heroField: 'heroImageUrl',
    includeDrafts: true,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' || a === '-i') args.input = argv[++i];
    else if (a === '--output' || a === '-o') args.output = argv[++i];
    else if (a === '--post-type') args.postType = argv[++i];
    else if (a === '--category-type') args.categoryType = argv[++i];
    else if (a === '--tag-type') args.tagType = argv[++i];
    else if (a === '--hero-field') args.heroField = argv[++i];
    else if (a === '--only-published') args.includeDrafts = false;
    else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  if (!args.input) {
    console.error('[wxr-to-sanity] --input is required.');
    printHelp();
    process.exit(1);
  }
  return args;
}

function printHelp() {
  console.log(`\nUsage: wxr-to-sanity --input <path.xml> [options]\n\nOptions:\n  --input, -i           WXR XML file path (required)\n  --output, -o          Output NDJSON path (default: tools/wxr-to-sanity/out/sanity.ndjson)\n  --post-type           Sanity document type for posts (default: post)\n  --category-type       Sanity document type for categories (default: category)\n  --tag-type            Sanity document type for tags (default: tag)\n  --hero-field          Field name to store hero image URL (default: heroImageUrl)\n  --only-published      Export only published posts\n  --help, -h            Show help\n`);
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
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

function stripHtml(html) {
  if (!html) return '';
  // Remove shortcodes like [caption]...[/caption]
  let text = String(html).replace(/\[[^\]]*\][^\[]*\/?\[[^\]]*\]/g, ' ');
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, ' ');
  // Decode a few common entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
  return text.replace(/\s+/g, ' ').trim();
}

function genKey(prefix = 'k') {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function toPortableTextFromPlain(text) {
  const safe = text || '';
  const childKey = genKey('s');
  const blockKey = genKey('b');
  return [
    {
      _type: 'block',
      _key: blockKey,
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: childKey,
          text: safe,
          marks: [],
        },
      ],
    },
  ];
}

function wpDateToISO(dateStr) {
  if (!dateStr) return null;
  // Expected format: YYYY-MM-DD HH:MM:SS (may be '0000-00-00 00:00:00')
  const s = String(dateStr).trim();
  if (/^0{4}-0{2}-0{2}/.test(s)) return null;
  // Interpret as local then treat as UTC-less string; append 'Z' to store as UTC if it's a GMT date
  // Many WXR exports include both post_date and post_date_gmt; we pass the *_gmt one here when available.
  const iso = s.replace(' ', 'T');
  // If it lacks timezone, append 'Z' to mark as UTC
  return /Z$|[+\-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z';
}

function buildAttachmentMap(items) {
  const map = new Map();
  for (const it of items) {
    const type = it['wp:post_type'];
    if (type === 'attachment') {
      const id = it['wp:post_id'];
      const url = it['wp:attachment_url'] || (it['guid'] && it['guid'].text);
      if (id && url) map.set(String(id), String(url));
    }
  }
  return map;
}

function extractThumbUrlFromPost(item, attachmentById) {
  const metas = unifyArray(item['wp:postmeta']);
  for (const m of metas) {
    if (!m) continue;
    if (m['wp:meta_key'] === '_thumbnail_id') {
      const refId = String(m['wp:meta_value'] || '').trim();
      if (refId && attachmentById.has(refId)) return attachmentById.get(refId);
    }
  }
  return null;
}

function parseCategoryTagNodes(catNodes) {
  const cats = [];
  const tags = [];
  for (const c of unifyArray(catNodes)) {
    if (!c) continue;
    const domain = c.domain || c['@_domain'] || c["wp:domain"]; // robustness
    const nicename = c.nicename || c['@_nicename'];
    const text = (c.text !== undefined ? c.text : typeof c === 'string' ? c : c['#text']) || '';
    const title = String(text).trim();
    const slug = slugify(nicename || title);
    if (!slug) continue;
    if (domain === 'category') cats.push({ title, slug });
    else if (domain === 'post_tag') tags.push({ title, slug });
  }
  return { cats, tags };
}

function main() {
  const args = parseArgs(process.argv);

  const xml = readXml(args.input);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    textNodeName: 'text',
    trimValues: false,
  });
  const json = parser.parse(xml);
  const items = unifyArray((((json || {}).rss || {}).channel || {}).item);
  if (!items.length) {
    console.error('[wxr-to-sanity] No <item> nodes found. Abort.');
    process.exit(1);
  }

  const attachmentById = buildAttachmentMap(items);
  const postDocs = [];
  const catSet = new Map(); // slug -> title
  const tagSet = new Map(); // slug -> title

  for (const it of items) {
    const type = it['wp:post_type'];
    if (type !== 'post') continue;

    const status = it['wp:status'];
    if (!args.includeDrafts && status !== 'publish') continue;

    const rawTitle = (it.title && it.title.text) || it.title || '';
    const title = String(rawTitle).trim();
    const slugCurrent = slugify(it['wp:post_name'] || title);
    const postId = String(it['wp:post_id'] || '').trim();
    const guid = (it.guid && it.guid.text) || it.guid || '';

    const contentHtml = (it['content:encoded'] && it['content:encoded'].text) || it['content:encoded'] || '';
    const excerptHtml = (it['excerpt:encoded'] && it['excerpt:encoded'].text) || it['excerpt:encoded'] || '';
    const excerpt = stripHtml(excerptHtml).slice(0, 1000);
    const bodyText = stripHtml(contentHtml);

    const pubAt = wpDateToISO(it['wp:post_date_gmt'] || it['wp:post_date']);
    const upAt = wpDateToISO(it['wp:post_modified_gmt'] || it['wp:post_modified']);

    const { cats, tags } = parseCategoryTagNodes(it.category);
    for (const c of cats) if (!catSet.has(c.slug)) catSet.set(c.slug, c.title);
    for (const t of tags) if (!tagSet.has(t.slug)) tagSet.set(t.slug, t.title);

    const heroUrl = extractThumbUrlFromPost(it, attachmentById);

    const catRefs = cats.map((c) => ({ _key: genKey('c'), _type: 'reference', _ref: `category-${c.slug}` }));
    const tagRefs = tags.map((t) => ({ _key: genKey('t'), _type: 'reference', _ref: `tag-${t.slug}` }));

    const doc = {
      _id: slugCurrent ? `post-${slugCurrent}` : (postId ? `wp-${postId}` : undefined),
      _type: args.postType,
      title,
      slug: { _type: 'slug', current: slugCurrent },
      excerpt,
      body: toPortableTextFromPlain(bodyText),
      categories: catRefs,
      tags: tagRefs,
      publishedAt: pubAt || null,
      updatedAt: upAt || null,
      wpId: postId || null,
      wpGuid: guid || null,
    };
    if (heroUrl) doc[args.heroField] = heroUrl;
    postDocs.push(doc);
  }

  // Build taxonomy documents
  const categoryDocs = [];
  for (const [slug, title] of catSet.entries()) {
    categoryDocs.push({
      _id: `category-${slug}`,
      _type: args.categoryType,
      title,
      slug: { _type: 'slug', current: slug },
    });
  }
  const tagDocs = [];
  for (const [slug, title] of tagSet.entries()) {
    tagDocs.push({
      _id: `tag-${slug}`,
      _type: args.tagType,
      title,
      slug: { _type: 'slug', current: slug },
    });
  }

  const allDocs = [...categoryDocs, ...tagDocs, ...postDocs];
  ensureDirForFile(args.output);
  const out = fs.createWriteStream(args.output, { encoding: 'utf8' });
  for (const d of allDocs) {
    out.write(JSON.stringify(d) + '\n');
  }
  out.end();
  out.on('finish', () => {
    console.log(`[wxr-to-sanity] Wrote ${allDocs.length} documents → ${args.output}`);
    console.log('[wxr-to-sanity] Next: sanity dataset import <file> staging');
  });
}

main();
