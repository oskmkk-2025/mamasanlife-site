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

const RAKUTEN_CARD_HTML = `
<a class="affiliate-btn affiliate-btn--rakuten" href="https://af.moshimo.com/af/c/click?a_id=5331008&p_id=7276&pc_id=20877&pl_id=91971" target="_blank" rel="noopener noreferrer nofollow sponsored">楽天カード をみる ＞</a><img src="//i.moshimo.com/af/i/impression?a_id=5331008&p_id=7276&pc_id=20877&pl_id=91971" width="1" height="1" style="border:none;" loading="lazy">
`;

async function restoreLinks() {
    console.log('Fetching relevant posts...');
    const posts = await client.fetch(`*[_type == "post" && (
        title match "*簿記*" || 
        title match "*FP*" || 
        slug.current == "mobile-number-portability" ||
        body[].children[].text match "*楽天カード*" ||
        body[].children[].text match "*くらしのマーケット*" ||
        body[].html match "*くらしのマーケット*"
    )]`);

    console.log(`Found ${posts.length} posts to process.`);

    for (const post of posts) {
        let updated = false;
        let body = [...post.body];

        // 1. Update "Kurashi no Market" labels
        body = body.map(block => {
            if (block._type === 'htmlEmbed' && block.html.includes('くらしのマーケット')) {
                const newHtml = block.html.replace(
                    /class="affiliate-btn affiliate-btn--others"[^>]*>([^<]*)<\/a>/,
                    'class="affiliate-btn affiliate-btn--others" href="https://px.a8.net/svt/ejp?a8mat=3T09W5+64Y96A+2Y6K+5Z6WZ" target="_blank" rel="noopener noreferrer nofollow sponsored">くらしのマーケットをみる ＞</a>'
                );
                if (newHtml !== block.html) {
                    updated = true;
                    return { ...block, html: newHtml };
                }
            }
            return block;
        });

        // 2. Restore Rakuten Card buttons near text links
        // We'll search for blocks that mention 楽天カード but don't have a button yet
        const hasRakutenBtn = body.some(b => b._type === 'htmlEmbed' && b.html.includes('affiliate-btn--rakuten') && b.html.includes('楽天カード'));
        if (!hasRakutenBtn) {
            const rakutenIdx = body.findIndex(b => b._type === 'block' && b.children.some(c => c.text.includes('楽天カード')));
            if (rakutenIdx !== -1) {
                // Insert button after the block
                body.splice(rakutenIdx + 1, 0, {
                    _type: 'htmlEmbed',
                    _key: `rakuten-restore-${Date.now()}`,
                    html: RAKUTEN_CARD_HTML
                });
                updated = true;
                console.log(`Added Rakuten Card button to: ${post.title}`);
            }
        }

        // 3. Restore Bookkeeping/FP specific buttons if missing
        if (post.title.includes('簿記') || post.title.includes('FP')) {
            // Check for common buttons like text books or courses
            const hasOmsuku = body.some(b => b._type === 'htmlEmbed' && b.html.includes('オンスク.jp'));
            if (!hasOmsuku && post.slug.current.includes('fp')) {
                // Restore Omsuku button
                body.push({
                    _type: 'htmlEmbed',
                    _key: `omsuku-restore-${Date.now()}`,
                    html: '<a class="affiliate-btn affiliate-btn--a8" href="https://px.a8.net/svt/ejp?a8mat=3NNG1Z+FP0DV6+408S+60WN6" target="_blank" rel="noopener noreferrer nofollow sponsored">オンスク.jpをみる ＞</a>'
                });
                updated = true;
                console.log(`Restored Omsuku button in: ${post.title}`);
            }
        }

        if (updated) {
            await client.patch(post._id).set({ body }).commit();
            console.log(`Updated: ${post.title}`);
        }
    }
}

restoreLinks().catch(err => {
    console.error(err);
    process.exit(1);
});
