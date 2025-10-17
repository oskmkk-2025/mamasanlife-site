#!/usr/bin/env node
/*
  Sanity differential upsert + optional hero image asset import.

  - Reads NDJSON (from wxr-to-sanity) and upserts: categories, tags, posts
  - Match key: slug.current (fallback: title)
  - Updatable fields (posts): body, excerpt, categories, tags, publishedAt, updatedAt, hero
  - Hero options:
      * keep URL in `heroImageUrl` (string)
      * upload URL → image asset → set to `heroImage` (image)

  Usage examples:
    node bin/sanity-upsert.js --dataset staging --input out/sanity.ndjson --studio /Users/makiko/GeminiProjects/sanity-blog
    node bin/sanity-upsert.js --dataset production --input out/sanity.ndjson --asset --remove-hero-url --hero-field heroImageUrl --asset-field heroImage --studio /path/to/studio

  Auth:
    - Prefer running via `sanity exec` with `--with-user-token` from the Studio dir, OR set env `SANITY_AUTH_TOKEN`.
*/

const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit').default;
const {createClient} = require('@sanity/client');

function parseArgs(argv) {
  const args = {
    dataset: 'staging',
    project: process.env.SANITY_PROJECT_ID || null,
    token: process.env.SANITY_AUTH_TOKEN || null,
    input: path.join(process.cwd(), 'tools/wxr-to-sanity/out/sanity.ndjson'),
    studio: process.env.SANITY_STUDIO_DIR || null,
    heroField: 'heroImageUrl',
    assetField: 'heroImage',
    doAsset: false,
    removeHeroUrl: false,
    dryRun: false,
    concurrency: 3,
    skipCreate: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset') args.dataset = argv[++i];
    else if (a === '--project') args.project = argv[++i];
    else if (a === '--token') args.token = argv[++i];
    else if (a === '--input' || a === '-i') args.input = argv[++i];
    else if (a === '--studio') args.studio = argv[++i];
    else if (a === '--hero-field') args.heroField = argv[++i];
    else if (a === '--asset-field') args.assetField = argv[++i];
    else if (a === '--asset') args.doAsset = true;
    else if (a === '--remove-hero-url') args.removeHeroUrl = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--concurrency') args.concurrency = parseInt(argv[++i], 10) || 3;
    else if (a === '--skip-create') args.skipCreate = true;
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
  }
  return args;
}

function printHelp() {
  console.log(`\nUsage: sanity-upsert --dataset <name> [options]\n\nOptions:\n  --dataset <name>         Target dataset (default: staging)\n  --project <id>           Sanity projectId (fallback: auto-detect via --studio)\n  --token <token>          Write token (fallback: SANITY_AUTH_TOKEN env)\n  --studio <dir>           Path to Studio dir to auto-detect projectId from sanity.config.ts\n  --input, -i <file>       NDJSON input (default: tools/wxr-to-sanity/out/sanity.ndjson)\n  --asset                  Upload heroImageUrl to image asset and set to heroImage field\n  --hero-field <name>      Field containing hero URL (default: heroImageUrl)\n  --asset-field <name>     Image field to set (default: heroImage)\n  --remove-hero-url        Remove URL field after asset import\n  --dry-run                No writes; log actions only\n  --concurrency <n>        Concurrent ops (default: 3)\n`);
}

function detectProjectId(studioDir) {
  if (!studioDir) return null;
  const cfgTs = path.join(studioDir, 'sanity.config.ts');
  const cfgJs = path.join(studioDir, 'sanity.config.js');
  let content = null;
  if (fs.existsSync(cfgTs)) content = fs.readFileSync(cfgTs, 'utf8');
  else if (fs.existsSync(cfgJs)) content = fs.readFileSync(cfgJs, 'utf8');
  if (!content) return null;
  const m = content.match(/projectId\s*:\s*['"]([a-z0-9]+)['"]/);
  return m ? m[1] : null;
}

function readNdjson(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

async function ensureTaxonomy(client, docs, type) {
  const ofType = docs.filter((d) => d._type === type);
  for (const d of ofType) {
    if (!d._id) continue;
    if (client && client.createIfNotExists && !this?.dryRun) {
      await client.createIfNotExists({_id: d._id, _type: type, title: d.title, slug: d.slug});
    }
  }
}

async function fetchImageBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

function ptEq(a, b) {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}

async function run() {
  const args = parseArgs(process.argv);
  if (!args.project) args.project = detectProjectId(args.studio);
  if (!args.project) {
    console.error('[sanity-upsert] projectId not provided and auto-detect failed. Use --project or --studio.');
    process.exit(1);
  }

  const tokenRaw = args.token || process.env.SANITY_AUTH_TOKEN || process.env.SANITY_WRITE_TOKEN || process.env.SANITY_SESSION_TOKEN || '';
  const token = typeof tokenRaw === 'string' ? tokenRaw.replace(/[^\x21-\x7E]/g, '') : tokenRaw;
  const client = createClient({
    projectId: args.project,
    dataset: args.dataset,
    token, // populated by env or --token
    apiVersion: '2025-09-01',
    useCdn: false,
  });

  const docs = readNdjson(args.input);
  // Ensure taxonomies first
  if (!args.dryRun && !args.skipCreate) {
    await ensureTaxonomy.call({dryRun: args.dryRun}, client, docs, 'category');
    await ensureTaxonomy.call({dryRun: args.dryRun}, client, docs, 'tag');
  }

  const posts = docs.filter((d) => d._type === 'post');
  const limit = pLimit(args.concurrency);

  const tasks = posts.map((p) => limit(async () => {
    const slug = p?.slug?.current;
    const title = p?.title;
    if (!slug && !title) return;
    const existing = await client.fetch(
      `*[_type == $t && defined(slug.current) && slug.current == $slug][0]{_id, slug, title, excerpt, body, ${args.heroField}, ${args.assetField}{asset->{_id}}, categories[]{_ref}, tags[]{_ref}, publishedAt, updatedAt}`,
      {t: 'post', slug}
    );

    let targetId = existing?._id;
    const setPatch = {};

    if (!existing) {
      if (args.skipCreate) {
        console.log(`[info] skip create post: ${slug}`)
        return
      }
      // Create new
      if (args.dryRun) {
        console.log(`[dry-run] create post: ${slug}`);
        return;
      }
      const created = await client.create({
        _id: p._id || undefined,
        _type: 'post',
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt ?? null,
        body: p.body ?? [],
        categories: p.categories ?? [],
        tags: p.tags ?? [],
        publishedAt: p.publishedAt ?? null,
        updatedAt: p.updatedAt ?? null,
      });
      targetId = created._id;
    } else {
      // Update changed fields only
      if ((p.excerpt || '') !== (existing.excerpt || '')) setPatch.excerpt = p.excerpt || null;
      if (!ptEq(p.body, existing.body)) setPatch.body = p.body || [];
      if (JSON.stringify(p.categories||[]) !== JSON.stringify(existing.categories||[])) setPatch.categories = p.categories || [];
      if (JSON.stringify(p.tags||[]) !== JSON.stringify(existing.tags||[])) setPatch.tags = p.tags || [];
      if ((p.publishedAt || null) !== (existing.publishedAt || null)) setPatch.publishedAt = p.publishedAt || null;
      if ((p.updatedAt || null) !== (existing.updatedAt || null)) setPatch.updatedAt = p.updatedAt || null;

      // hero URL → image asset (optional)
      const existingAssetId = existing?.[args.assetField]?.asset?._id
      const hasHeroUrl = !!p[args.heroField]
      if (!args.dryRun && args.doAsset && hasHeroUrl && !existingAssetId) {
        try {
          const buf = await fetchImageBuffer(p[args.heroField]);
          const filename = path.basename(new URL(p[args.heroField]).pathname) || 'hero.jpg';
          const asset = await client.assets.upload('image', buf, {filename});
          setPatch[args.assetField] = {_type: 'image', asset: {_type: 'reference', _ref: asset._id}};
          if (args.removeHeroUrl) setPatch[args.heroField] = undefined; // unset below
        } catch (e) {
          console.warn(`[warn] hero asset upload failed for ${slug}: ${e.message}`);
        }
      } else if (!args.doAsset && hasHeroUrl && p[args.heroField] !== existing[args.heroField]) {
        setPatch[args.heroField] = p[args.heroField];
      } else if (existingAssetId) {
        // already has an asset; keep as is
        // no-op
      }

      if (Object.keys(setPatch).length === 0) return; // nothing to update
      if (args.dryRun) {
        console.log(`[dry-run] patch ${existing._id}:`, Object.keys(setPatch));
        return;
      }
      let patch = client.patch(existing._id).set(setPatch);
      if (args.removeHeroUrl && args.doAsset) patch = patch.unset([args.heroField]);
      await patch.commit();
    }
  }));

  await Promise.all(tasks);
  console.log('[sanity-upsert] Completed upsert for', posts.length, 'posts on dataset', args.dataset);
}

run().catch((err) => {
  console.error('[sanity-upsert] ERROR:', err);
  process.exit(1);
});
