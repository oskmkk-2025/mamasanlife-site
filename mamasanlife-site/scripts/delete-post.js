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

async function deletePost(postId) {
    try {
        console.log(`Deleting post ${postId}...`);
        await client.delete(postId);
        console.log(`Successfully deleted post ${postId}`);
    } catch (err) {
        console.error(`Failed to delete post ${postId}:`, err);
    }
}

const [, , postId] = process.argv;
if (postId) {
    deletePost(postId);
} else {
    console.log('Usage: node delete-post.js <postId>');
}
