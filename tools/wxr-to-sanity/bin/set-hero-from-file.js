#!/usr/bin/env node
// Set a post's hero image from a local file, uploading it as a Sanity image asset.
// Usage:
//   node bin/set-hero-from-file.js --dataset staging \
//     --project gqv363gs --slug <slug> --file /path/to/image.png \
//     --asset-field mainImage [--remove-hero-url]

const fs = require('fs');
const path = require('path');
const {createClient} = require('@sanity/client');

function parseArgs(argv) {
  const args = {
    dataset: null,
    project: process.env.SANITY_PROJECT_ID || null,
    token: process.env.SANITY_AUTH_TOKEN || null,
    slug: null,
    file: null,
    assetField: 'mainImage',
    removeHeroUrl: false,
    studio: process.env.SANITY_STUDIO_DIR || null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dataset') args.dataset = argv[++i];
    else if (a === '--project') args.project = argv[++i];
    else if (a === '--token') args.token = argv[++i];
    else if (a === '--slug') args.slug = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--asset-field') args.assetField = argv[++i];
    else if (a === '--remove-hero-url') args.removeHeroUrl = true;
    else if (a === '--studio') args.studio = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Usage: set-hero-from-file --dataset <name> --project <id> --slug <slug> --file <path> [--asset-field mainImage] [--remove-hero-url]');
      process.exit(0);
    }
  }
  if (!args.dataset || !args.project || !args.slug || !args.file) {
    console.error('[set-hero-from-file] Missing required args.');
    process.exit(1);
  }
  if (!fs.existsSync(args.file)) {
    console.error('[set-hero-from-file] File not found:', args.file);
    process.exit(1);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const client = createClient({
    projectId: args.project,
    dataset: args.dataset,
    token: args.token || process.env.SANITY_SESSION_TOKEN,
    apiVersion: '2025-09-01',
    useCdn: false,
  });

  const post = await client.fetch("*[_type=='post' && slug.current==$slug][0]{_id, slug}", {slug: args.slug});
  if (!post?._id) {
    console.error('[set-hero-from-file] Post not found for slug:', args.slug);
    process.exit(1);
  }

  const filename = path.basename(args.file);
  const buf = fs.readFileSync(args.file);
  const asset = await client.assets.upload('image', buf, {filename});

  let patch = client.patch(post._id).set({
    [args.assetField]: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
  });
  if (args.removeHeroUrl) patch = patch.unset(['heroImageUrl']);

  const committed = await patch.commit();
  console.log('[set-hero-from-file] Updated', committed._id, '→', args.assetField, 'asset', asset._id);
}

main().catch((err) => {
  console.error('[set-hero-from-file] ERROR:', err.message);
  process.exit(1);
});

