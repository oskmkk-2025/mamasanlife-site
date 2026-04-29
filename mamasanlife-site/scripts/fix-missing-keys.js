const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Manually load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
        }
    });
}

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-03-14',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
});

console.log('Project ID:', process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
console.log('Dataset:', process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET);

function generateKey() {
    return crypto.randomBytes(6).toString('hex');
}

async function fixMissingKeys() {
    try {
        console.log('Fetching posts...');
        const posts = await client.fetch('*[_type == "post"]');
        console.log(`Checking ${posts.length} posts...`);

        let updatedCount = 0;

        for (const post of posts) {
            let hasMissingKey = false;
            let updatedPost = { ...post };

            function processAnything(val) {
                if (Array.isArray(val)) {
                    return val.map(item => {
                        if (typeof item === 'object' && item !== null) {
                            let updatedItem = { ...item };
                            if (!updatedItem._key && !updatedItem._id) { // Top-level docs have _id, array items need _key
                                hasMissingKey = true;
                                updatedItem._key = generateKey();
                            }
                            // Process all properties of the object recursively
                            for (const key in updatedItem) {
                                updatedItem[key] = processAnything(updatedItem[key]);
                            }
                            return updatedItem;
                        }
                        return item;
                    });
                } else if (typeof val === 'object' && val !== null) {
                    let updatedVal = { ...val };
                    for (const key in updatedVal) {
                        updatedVal[key] = processAnything(updatedVal[key]);
                    }
                    return updatedVal;
                }
                return val;
            }

            // Specifically target 'body' but also check everything else just in case
            for (const key in updatedPost) {
                if (key.startsWith('_')) continue; // Skip internal fields like _id, _type
                updatedPost[key] = processAnything(updatedPost[key]);
            }

            if (hasMissingKey) {
                console.log(`Fixing keys for post: ${post._id} (${post.title || 'Untitled'})`);
                await client.createOrReplace(updatedPost);
                updatedCount++;
            }
        }

        console.log(`Done! Updated ${updatedCount} posts.`);
    } catch (err) {
        console.error('Failed to fix keys:', err);
    }
}

fixMissingKeys();
