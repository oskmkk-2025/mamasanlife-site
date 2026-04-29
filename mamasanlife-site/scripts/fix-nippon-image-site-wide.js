const { createClient } = require("@sanity/client");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach(line => {
        const [key, ...value] = line.split("=");
        if (key && value) {
            process.env[key.trim()] = value.join("=").trim().replace(/^"(.*)"$/, "$1");
        }
    });
}

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: "2024-03-14",
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
});

async function fixNipponImages() {
    console.log("Fetching all posts...");
    const posts = await client.fetch("*[_type == \"post\"]");

    const brokenId = "41s3bpWFrPL";
    const workingId = "51+xe2eux3L";
    const brokenPart = "41s3bpWFrPL._SL500_.jpg";
    const workingPart = "images/I/51+xe2eux3L._SL500_.jpg";

    let totalFixed = 0;

    for (const post of posts) {
        let modified = false;

        const processBlocks = (blocks) => {
            if (!blocks) return false;
            let blockModified = false;
            blocks.forEach(block => {
                // Check moshimoEasyLink data.image
                if (block._type === "moshimoEasyLink" && block.data?.image) {
                    if (block.data.image.includes(brokenId)) {
                        console.log(`  Fixing moshimoEasyLink image in "${post.title}" (${post._id})`);
                        // The observed broken URL is https://m.media-amazon.com/41s3bpWFrPL._SL500_.jpg
                        // The working one should be https://m.media-amazon.com/images/I/51+xe2eux3L._SL500_.jpg
                        block.data.image = block.data.image.replace(brokenPart, workingPart);
                        if (!block.data.image.includes("images/I/")) {
                            block.data.image = block.data.image.replace(brokenId, workingId);
                        }
                        blockModified = true;
                    }
                }

                // Check htmlEmbed html
                if (block._type === "htmlEmbed" && block.html) {
                    if (block.html.includes(brokenId)) {
                        console.log(`  Fixing htmlEmbed in "${post.title}" (${post._id})`);
                        block.html = block.html.split(brokenId).join(workingId);
                        blockModified = true;
                    }
                }
            });
            return blockModified;
        };

        if (processBlocks(post.body)) modified = true;
        if (processBlocks(post.affiliateBlocks)) modified = true;

        if (modified) {
            console.log(`Updating post: ${post.title}`);
            await client
                .patch(post._id)
                .set({
                    body: post.body,
                    affiliateBlocks: post.affiliateBlocks
                })
                .commit();
            totalFixed++;
        }
    }

    console.log(`Done. Total posts fixed: ${totalFixed}`);
}

fixNipponImages().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
