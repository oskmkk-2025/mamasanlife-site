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

async function surgicalFix() {
    console.log('Starting surgical fix for specific articles...');

    // 1. Fix MNP Article (Nippon Tsushin SIM)
    const mnpPost = await client.fetch(`*[_type == "post" && slug == "mobile-number-portability"][0]`);
    if (mnpPost) {
        console.log('Fixing MNP article...');
        let body = [...mnpPost.body];
        body = body.map(block => {
            if (block._type === 'htmlEmbed' && block.html.includes('NT-ST2-P')) {
                // Force a known good image URL and ensure correct structure
                let html = block.html.replace(/"41s3bpWFrPL[^"]*"/g, '"51+xe2eux3L._SL500_.jpg"')
                    .replace(/"c_p":"[^"]*"/g, '"c_p":"/images/I"');
                if (!html.includes('/images/I')) {
                    html = html.replace('"p":', '"c_p":"/images/I","p":');
                }
                return { ...block, html };
            }
            return block;
        });
        await client.patch(mnpPost._id).set({ body }).commit();
        console.log('MNP article fixed.');
    }

    // 2. Fix Washing Article (Kurashi no Market)
    const washPost = await client.fetch(`*[_type == "post" && slug == "house-cleaning-washing-machine"][0]`);
    if (washPost) {
        console.log('Fixing Washing article...');
        let body = [...washPost.body];
        body = body.map(block => {
            if (block._type === 'htmlEmbed' && block.html.includes('くらしのマー')) {
                // Aggressive replacement
                let html = block.html.replace(/>\s*くらしのマーケ\s*をみる\s*＞?\s*</g, '>くらしのマーケットをみる ＞<');
                return { ...block, html };
            }
            return block;
        });
        await client.patch(washPost._id).set({ body }).commit();
        console.log('Washing article fixed.');
    }

    // 3. Fix Bookkeeping/FP Articles (Raw code / Encoded text)
    const bookPosts = await client.fetch(`*[_type == "post" && (title match "*簿記*" || title match "*FP*")]`);
    for (const post of bookPosts) {
        console.log(`Fixing Bookkeeping/FP article: ${post.title}`);
        let body = [];
        for (const block of post.body) {
            // Remove the weird blocks and replace with htmlEmbed
            const combinedText = (block.children || []).map(c => c.text).join('');
            if (block._type === 'block' && (combinedText.includes('msmaflink') || combinedText.includes('%81%AE'))) {
                console.log('Converting problematic block to htmlEmbed...');
                let htmlContent = combinedText.trim();
                // If it's encoded, we might need more logic, but for now let's hope it's the script
                if (!htmlContent.includes('<script')) {
                    htmlContent = `<script type="text/javascript">\n${htmlContent}\n</script>\n<div id="msmaflink-restore">リンク</div>`;
                }
                body.push({
                    _type: 'htmlEmbed',
                    _key: block._key,
                    html: htmlContent
                });
            } else {
                body.push(block);
            }
        }
        await client.patch(post._id).set({ body }).commit();
        console.log(`Post updated: ${post.title}`);
    }

    console.log('Surgical fix completed.');
}

surgicalFix().catch(console.error);
