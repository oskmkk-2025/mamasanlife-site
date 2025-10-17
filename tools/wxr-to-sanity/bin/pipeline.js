#!/usr/bin/env node
/*
  End-to-end pipeline for refreshing from a WordPress WXR into Sanity.

  Steps:
    1) Quick inspect WXR (counts)
    2) Convert WXR -> NDJSON
    3) Upsert NDJSON into Sanity (staging by default)
    4) Enrich body: inline images + internal link rewriting
    5) Fix missing _key in PT arrays and ref arrays (body/categories/tags)
    6) Write a brief worklog with timings

  Usage example:
    node bin/pipeline.js --input ./WordPress.2025-10-08.xml --project gqv363gs --dataset staging

  Auth:
    - Provide write token via env: SANITY_AUTH_TOKEN (Editor以上)
    - Or run each step manually with `sanity exec --with-user-token` from studio dir (not automated here)
*/

const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');

function parseArgs(argv) {
  const args = {
    input: null,
    output: null,
    project: process.env.SANITY_PROJECT_ID || null,
    dataset: process.env.SANITY_DATASET || 'staging',
    studio: process.env.SANITY_STUDIO_DIR || null,
    allowExternalImages: false,
    denyHosts: [],
    dryRun: false,
    verbose: true,
  };
  for (let i=2;i<argv.length;i++){
    const a=argv[i];
    if (a==='--input' || a==='-i') args.input = argv[++i];
    else if (a==='--output' || a==='-o') args.output = argv[++i];
    else if (a==='--project') args.project = argv[++i];
    else if (a==='--dataset') args.dataset = argv[++i];
    else if (a==='--studio') args.studio = argv[++i];
    else if (a==='--allow-external-images') args.allowExternalImages = true;
    else if (a==='--deny-host') args.denyHosts.push(argv[++i]);
    else if (a==='--dry-run') args.dryRun = true;
    else if (a==='--silent') args.verbose = false;
    else if (a==='--help' || a==='-h') { printHelp(); process.exit(0); }
  }
  if (!args.input) { console.error('[pipeline] --input <WXR.xml> is required'); process.exit(1); }
  if (!args.project) { console.error('[pipeline] --project <id> is required (or set SANITY_PROJECT_ID)'); process.exit(1); }
  if (!args.output) args.output = path.join(process.cwd(), 'tools/wxr-to-sanity/out/sanity-pipeline.ndjson');
  return args;
}

function printHelp(){
  console.log(`\nUsage: pipeline --input <WXR.xml> --project <id> [--dataset staging] [--allow-external-images] [--deny-host <host>...] [--dry-run]\n`);
}

function runStep(title, cmd, args, opts={}){
  const started = Date.now();
  if (opts.verbose) console.log(`\n[pipeline] ▶ ${title}`);
  const {status, stdout, stderr} = spawnSync(cmd, args, {stdio: ['ignore','pipe','pipe'], env: process.env});
  const ended = Date.now();
  const sec = ((ended-started)/1000).toFixed(1);
  if (stdout?.length) process.stdout.write(stdout.toString());
  if (stderr?.length) process.stderr.write(stderr.toString());
  if (status !== 0) throw new Error(`[pipeline] Step failed: ${title} (exit=${status})`);
  if (opts.verbose) console.log(`[pipeline] ✓ ${title} (${sec}s)`);
  return {sec: Number(sec)};
}

function quickInspect(file){
  const xml = fs.readFileSync(file,'utf8');
  const postCount = (xml.match(/<wp:post_type><!\[CDATA\[post\]\]><\/wp:post_type>/g)||[]).length;
  const attCount = (xml.match(/<wp:post_type><!\[CDATA\[attachment\]\]><\/wp:post_type>/g)||[]).length;
  const thumbRefs = (xml.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>/g)||[]).length;
  return {postCount, attCount, thumbRefs};
}

function ensureDir(p){ fs.mkdirSync(path.dirname(p), {recursive:true}); }

function writeWorklog(args, times, inspect){
  const outDir = path.join(process.cwd(), 'ops');
  fs.mkdirSync(outDir, {recursive:true});
  const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'');
  const out = path.join(outDir, `worklog-${stamp}.md`);
  const lines = [];
  lines.push(`# Pipeline Worklog (${new Date().toISOString()})`);
  lines.push('');
  lines.push(`- Input: ${args.input}`);
  lines.push(`- Project: ${args.project}`);
  lines.push(`- Dataset: ${args.dataset}`);
  lines.push(`- External images: ${args.allowExternalImages ? 'allowed (filtered)' : 'internal uploads only'}`);
  lines.push('');
  lines.push('## Inspect');
  lines.push(`- posts=${inspect.postCount}, attachments=${inspect.attCount}, thumbnailRefs=${inspect.thumbRefs}`);
  lines.push('');
  lines.push('## Timings (s)');
  for (const [k,v] of Object.entries(times)) lines.push(`- ${k}: ${v} s`);
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`[pipeline] Wrote worklog → ${out}`);
}

async function main(){
  const args = parseArgs(process.argv);
  if (!fs.existsSync(args.input)) { console.error('[pipeline] input not found:', args.input); process.exit(1); }

  const times = {};
  const inspect = quickInspect(args.input);
  if (args.verbose) console.log('[pipeline] Inspect:', inspect);

  // Step 1: Convert
  ensureDir(args.output);
  const BIN = __dirname; // .../tools/wxr-to-sanity/bin
  const WXRSCRIPT = path.join(BIN, 'wxr-to-sanity.js');
  const UPSERT = path.join(BIN, 'sanity-upsert.js');
  const ENRICH = path.join(BIN, 'enrich-body-and-links.js');
  const FIX = path.join(BIN, 'fix-missing-keys.js');

  const conv = runStep('Convert WXR → NDJSON', 'node', [WXRSCRIPT,'--input',args.input,'--output',args.output], {verbose: args.verbose});
  times.convert = conv.sec;

  if (args.dryRun){ writeWorklog(args, times, inspect); process.exit(0); }

  // Step 2: Upsert
  const upsertArgs = [UPSERT,'--dataset',args.dataset,'--project',args.project,'--input',args.output];
  const upsert = runStep('Upsert NDJSON → Sanity', 'node', upsertArgs, {verbose: args.verbose});
  times.upsert = upsert.sec;

  // Step 3: Enrich body (images + internal links)
  const enrichArgs = [ENRICH,'--dataset',args.dataset,'--project',args.project,'--input',args.input];
  if (args.allowExternalImages) enrichArgs.push('--allow-external-images');
  for (const h of args.denyHosts) enrichArgs.push('--deny-host', h);
  const enrich = runStep('Enrich body (images+links)', 'node', enrichArgs, {verbose: args.verbose});
  times.enrich = enrich.sec;

  // Step 4: Fix missing keys
  const fix = runStep('Fix missing _key in arrays', 'node', [FIX,'--dataset',args.dataset,'--project',args.project], {verbose: args.verbose});
  times.fixkeys = fix.sec;

  writeWorklog(args, times, inspect);
}

main().catch((e)=>{ console.error('[pipeline] ERROR', e); process.exit(1); });
