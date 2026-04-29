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

async function fixLabelsAndRestore() {
    console.log('Fetching posts with Kurashi no Market or Bookkeeping/FP...');
    const posts = await client.fetch(`*[_type == "post" && (
        body[].html match "*くらしのマーケット*" ||
        body[].children[].text match "*くらしのマーケット*" ||
        title match "*簿記*" ||
        title match "*FP*"
    )]`);

    for (const post of posts) {
        let updated = false;
        let body = [...post.body];

        // 1. Fix Kurashi no Market labels
        body = body.map(block => {
            if (block._type === 'htmlEmbed' && block.html.includes('くらしのマーケット')) {
                // Target the label specifically
                let newHtml = block.html.replace(
                    /class="affiliate-btn affiliate-btn--others"[^>]*>([^<]*)<\/a>/,
                    'class="affiliate-btn affiliate-btn--others" href="https://px.a8.net/svt/ejp?a8mat=3T09W5+64Y96A+2Y6K+5Z6WZ" target="_blank" rel="noopener noreferrer nofollow sponsored">くらしのマーケットをみる ＞</a>'
                );
                // Also handle cases where it might not have the --others class or has different color
                if (newHtml === block.html) {
                    newHtml = block.html.replace(
                        /class="affiliate-btn[^"]*"[^>]*>([^<]*)<\/a>/,
                        'class="affiliate-btn affiliate-btn--others" href="https://px.a8.net/svt/ejp?a8mat=3T09W5+64Y96A+2Y6K+5Z6WZ" target="_blank" rel="noopener noreferrer nofollow sponsored">くらしのマーケットをみる ＞</a>'
                    );
                }

                if (newHtml !== block.html) {
                    updated = true;
                    return { ...block, html: newHtml };
                }
            }
            return block;
        });

        // 2. Specialized restoration for Bookkeeping/FP
        if (post.title.includes('簿記') || post.title.includes('FP')) {
            // Check if standardized buttons for texts/courses exist
            const textBlocks = body.filter(b => b._type === 'block' && b.children.some(c => c.text.includes('Amazon') || c.text.includes('楽天')));
            for (const tb of textBlocks) {
                const text = tb.children.map(c => c.text).join('');
                if (text.includes('みんなが欲しかった') && !body.some(b => b._type === 'htmlEmbed' && b.html.includes('Amazonでみる'))) {
                    // Potential missing button for Bookkeeping text
                    // We don't have the exact link here, but we can at least flag it or try to find a placeholder
                    console.log(`Potential missing button in ${post.title} for: ${text}`);
                }
            }
        }

        if (updated) {
            await client.patch(post._id).set({ body }).commit();
            console.log(`Updated labels in: ${post.title}`);
        }
    }
}

fixLabelsAndRestore().catch(console.error);
