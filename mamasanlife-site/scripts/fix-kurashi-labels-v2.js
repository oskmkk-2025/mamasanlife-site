const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
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

async function standardizeLabels() {
    console.log('Fetching all posts with Kurashi no Market...');
    const posts = await client.fetch(`*[_type == "post" && (body[].html match "*くらしのマーケ*" || body[].html match "*くらしのマーケット*")]`);
    console.log(`Found ${posts.length} posts.`);

    const TARGET_LABEL = 'くらしのマーケットをみる ＞';
    const CORRECT_HTML = `<a class="affiliate-btn affiliate-btn--others" href="https://px.a8.net/svt/ejp?a8mat=3T09W5+64Y96A+2Y6K+5Z6WZ" target="_blank" rel="noopener noreferrer nofollow sponsored">${TARGET_LABEL}</a>`;

    for (const post of posts) {
        let updated = false;
        let body = [...post.body];

        body = body.map(block => {
            if (block._type === 'htmlEmbed' && (block.html.includes('くらしのマーケ') || block.html.includes('くらしのマーケット'))) {
                // Replace the entire tag or just the label
                // Let's replace the whole string to ensure it's correct
                const newHtml = block.html.replace(
                    /<a class="affiliate-btn[^>]*>([^<]*)<\/a>/,
                    CORRECT_HTML
                );

                if (newHtml !== block.html) {
                    updated = true;
                    return { ...block, html: newHtml };
                }
            }
            return block;
        });

        if (updated) {
            await client.patch(post._id).set({ body }).commit();
            console.log(`Updated labels in: ${post.title}`);
        }
    }
}

standardizeLabels().catch(console.error);
