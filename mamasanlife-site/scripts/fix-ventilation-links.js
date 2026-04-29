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

async function fixVentilationArticle() {
    const slug = 'ventilation-fan-cleaning';
    const kurashiHtml = `<a class="affiliate-btn affiliate-btn--afb" href="https://t.afi-b.com/visit.php?a=G142682-w468243f&p=x929565W" rel="nofollow">くらしのマーケット</a><img src="https://t.afi-b.com/lead/G142682/x929565W/w468243f" width="1" height="1" style="border:none;" />`;

    console.log(`Processing ${slug}...`);
    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug });
    if (!post) {
        console.error(`Post not found: ${slug}`);
        return;
    }

    // 1. Update Tags (ensure it's there)
    let tags = post.tags || [];
    if (!tags.includes('くらしのマーケット')) {
        tags.push('くらしのマーケット');
    }

    // 2. Update Body
    let body = post.body || [];
    let updatedCount = 0;

    const newBody = body.map(block => {
        if (block._type === 'block') {
            const textCombined = (block.children || []).map(c => c.text || '').join('');

            // Case 1: Text contains "くらしのマーケットをみる" or similar
            if (textCombined.includes('くらしのマーケットをみる') || textCombined.includes('くらしのマーケットを見る')) {
                updatedCount++;
                return {
                    _type: 'htmlEmbed',
                    _key: block._key + '_html',
                    html: kurashiHtml
                };
            }

            // Case 2: Check markDefs for broken links
            if (block.markDefs && block.markDefs.some(m => m.href && m.href.includes('visit-php'))) {
                // If the block contains a broken Kurashi link, convert the whole block to a button
                updatedCount++;
                return {
                    _type: 'htmlEmbed',
                    _key: block._key + '_html_broken',
                    html: kurashiHtml
                };
            }
        }
        return block;
    });

    // Remove empty legacy ranking blocks if they exist at the top
    // Blocks with only newlines and markDefs for /in or /link
    const filteredBody = newBody.filter(block => {
        if (block._type === 'block' && block.style === 'normal') {
            const text = (block.children || []).map(c => c.text || '').join('').trim();
            if (text === '' && block.markDefs && block.markDefs.some(m => m.href && (m.href.includes('/in') || m.href.includes('/link')))) {
                return false; // Remove this block
            }
        }
        return true;
    });

    await client.patch(post._id)
        .set({ tags, body: filteredBody })
        .commit();

    console.log(`Updated ${slug} (Converted ${updatedCount} blocks to Kurashi buttons, cleaned up legacy blocks)`);
}

fixVentilationArticle().catch(console.error);
