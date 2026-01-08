const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

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
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: '2024-03-14',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
});

async function uploadAndUpdate(postId, filePath) {
    try {
        console.log(`Uploading ${filePath} for post ${postId}...`);
        const asset = await client.assets.upload('image', fs.createReadStream(filePath), {
            filename: path.basename(filePath),
        });

        await client
            .patch(postId)
            .set({
                heroImage: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: asset._id,
                    },
                },
            })
            .commit();

        console.log(`Successfully updated post ${postId}`);
    } catch (err) {
        console.error(`Failed to update post ${postId}:`, err);
    }
}

const [, , postId, filePath] = process.argv;
if (postId && filePath) {
    uploadAndUpdate(postId, filePath);
} else {
    console.log('Usage: node update-post-image.js <postId> <filePath>');
}
