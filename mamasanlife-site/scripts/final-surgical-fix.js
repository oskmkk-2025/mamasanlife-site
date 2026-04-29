const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

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

async function finalSurgicalFix() {
    console.log('Starting final surgical fix...');

    // 1. Fix Kurashi no Market typo site-wide
    const allPosts = await client.fetch(`*[_type == "post" && body[].html match "*くらしのマーケットット*"]`);
    console.log(`Found ${allPosts.length} posts with Kurashi typo.`);
    for (const post of allPosts) {
        let body = post.body.map(block => {
            if (block._type === 'htmlEmbed' && block.html.includes('くらしのマーケットット')) {
                return { ...block, html: block.html.replace(/くらしのマーケットット/g, 'くらしのマーケット') };
            }
            return block;
        });
        await client.patch(post._id).set({ body }).commit();
        console.log(`Fixed typo in: ${post.title}`);
    }

    // 2. Fix Bookkeeping 3 article specifically
    const book3Slug = 'qualification-nissho-bookkeeping3-test';
    const book3Post = await client.fetch(`*[_type == "post" && slug.current == "${book3Slug}"][0]`);
    if (book3Post) {
        console.log(`Fixing Bookkeeping 3 article: ${book3Post.title}`);
        let body = [];
        let updated = false;
        for (const block of book3Post.body) {
            const combinedText = (block.children || []).map(c => c.text).join('');
            if (block._type === 'block' && combinedText.includes('msmaflink')) {
                console.log('Found msmaflink in block, converting to htmlEmbed...');
                body.push({
                    _type: 'htmlEmbed',
                    _key: block._key,
                    html: `<script type="text/javascript">\n${combinedText.trim()}\n</script>\n<div id="msmaflink-restore">リンク</div>`
                });
                updated = true;
            } else {
                body.push(block);
            }
        }
        if (updated) {
            await client.patch(book3Post._id).set({ body }).commit();
            console.log('Bookkeeping 3 article updated.');
        } else {
            console.log('No msmaflink blocks found in Bookkeeping 3 article body? Checking for encoding...');
            // Maybe it's encoded in a different way or already htmlEmbed but broken
            let body2 = book3Post.body.map(block => {
                if (block._type === 'htmlEmbed' && block.html.includes('%81%AE')) {
                    try {
                        const decoded = decodeURIComponent(block.html);
                        if (decoded.includes('msmaflink')) {
                            return { ...block, html: decoded };
                        }
                    } catch (e) { }
                }
                return block;
            });
            await client.patch(book3Post._id).set({ body: body2 }).commit();
        }
    }

    console.log('Final surgical fix completed.');
}

finalSurgicalFix().catch(console.error);
