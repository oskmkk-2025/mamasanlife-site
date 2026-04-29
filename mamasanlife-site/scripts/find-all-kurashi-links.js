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
    projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
    useCdn: false,
    apiVersion: '2023-05-03',
    token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
});

async function findAllKurashiTextLinks() {
    console.log('Searching for all articles with text-based Kurashi links...');
    const posts = await client.fetch(`*[_type == "post"]`);
    const targetPosts = [];

    posts.forEach(post => {
        let hasTextLink = false;
        const body = post.body || [];

        body.forEach(block => {
            if (block._type === 'block') {
                const text = (block.children || []).map(c => c.text || '').join('');
                if (text.includes('くらしのマーケット')) {
                    // Check if it's a link in markDefs
                    if (block.markDefs && block.markDefs.some(m => m.href && (m.href.includes('afi-b.com') || m.href.includes('visit.php')))) {
                        hasTextLink = true;
                    }
                }
            }
        });

        if (hasTextLink) {
            targetPosts.push({
                slug: post.slug?.current,
                title: post.title
            });
        }
    });

    if (targetPosts.length > 0) {
        console.log('Found articles with text-based Kurashi links:');
        targetPosts.forEach(p => console.log(`- ${p.title} (${p.slug})`));
    } else {
        console.log('No articles with text-based Kurashi links found (they might already be buttons or tags).');
    }
}

findAllKurashiTextLinks().catch(console.error);
