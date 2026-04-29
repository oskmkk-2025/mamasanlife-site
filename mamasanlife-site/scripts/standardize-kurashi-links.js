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

async function standardizeKurashiLinks() {
    const kurashiHtml = `<a class="affiliate-btn affiliate-btn--afb" href="https://t.afi-b.com/visit.php?a=G142682-w468243f&p=x929565W" rel="nofollow">くらしのマーケット</a><img src="https://t.afi-b.com/lead/G142682/x929565W/w468243f" width="1" height="1" style="border:none;" />`;

    console.log('Fetching all posts to standardize Kurashi links...');
    const posts = await client.fetch(`*[_type == "post"]`);

    for (const post of posts) {
        let body = post.body || [];
        let updated = false;

        const newBody = body.map(block => {
            // Case 1: HTML Embed that's missing the button class
            if (block._type === 'htmlEmbed') {
                if ((block.html?.includes('kurashi') || block.html?.includes('afi-b.com')) && !block.html.includes('affiliate-btn')) {
                    updated = true;
                    return {
                        ...block,
                        html: kurashiHtml
                    };
                }
            }

            // Case 2: Normal text block that has a Kurashi link (even if it's working)
            if (block._type === 'block') {
                const text = (block.children || []).map(c => c.text || '').join('');
                const hasAfiB = block.markDefs?.some(m => m.href?.includes('afi-b.com') || m.href?.includes('visit.php'));

                if (hasAfiB) {
                    updated = true;
                    return {
                        _type: 'htmlEmbed',
                        _key: block._key + '_html_standard',
                        html: kurashiHtml
                    };
                }
            }
            return block;
        });

        if (updated) {
            console.log(`Updating post: ${post.title} (${post.slug?.current})...`);
            await client.patch(post._id)
                .set({ body: newBody })
                .commit();
        }
    }
    console.log('Standardization complete.');
}

standardizeKurashiLinks().catch(console.error);
