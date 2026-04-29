const fs = require("fs");
const path = require("path");
const {createClient} = require("@sanity/client");

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const text = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv(path.join(process.cwd(), ".env.local"));
const TOKEN = env.SANITY_WRITE_TOKEN || process.env.SANITY_WRITE_TOKEN;
if (!TOKEN) { console.error("ERROR: SANITY_WRITE_TOKEN not found"); process.exit(1); }
console.log("[1/6] Token loaded:", TOKEN.slice(0, 8) + "...(" + TOKEN.length + " chars)");

const client = createClient({
  projectId: "gqv363gs",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: TOKEN,
  useCdn: false,
});

(async () => {
  const localPath = "/Users/makiko/Downloads/ChatGPT Image 2026年4月28日 21_13_18.png";
  if (!fs.existsSync(localPath)) {
    console.error("ERROR: file not found:", localPath);
    process.exit(1);
  }
  console.log("[2/6] File exists:", localPath);

  const buf = fs.readFileSync(localPath);
  console.log("[3/6] File size:", buf.length, "bytes");

  console.log("[4/6] Uploading image to Sanity...");
  const asset = await client.assets.upload("image", buf, {
    filename: "hicognitive-eyecatch.png",
  });
  console.log("[4/6] Uploaded asset:", asset._id);

  console.log("[5/6] Fetching post by slug...");
  const post = await client.fetch(
    `*[_type == "post" && slug.current == "hicognitive-ability-son-exam-strategy"][0]{_id, title}`
  );
  if (!post) { console.error("ERROR: Post not found"); process.exit(1); }
  console.log("[5/6] Found post:", post._id, post.title);

  console.log("[6/6] Patching mainImage...");
  const result = await client
    .patch(post._id)
    .set({
      mainImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
      },
    })
    .commit();
  console.log("[6/6] Patched:", result._id, "rev:", result._rev);
  console.log("=== DONE ===");
})().catch(e => {
  console.error("FAILED:", e.message);
  console.error(e.stack);
  process.exit(1);
});
