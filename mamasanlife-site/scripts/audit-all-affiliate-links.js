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

async function auditAllAffiliateLinks() {
    console.log('Auditing all text-based affiliate links...');
    const posts = await client.fetch(`*[_type == "post"]`);
    const results = [];

    posts.forEach(post => {
        const body = post.body || [];
        const linksFound = [];

        body.forEach((block, index) => {
            if (block._type === 'block' && block.markDefs) {
                block.markDefs.forEach(mark => {
                    if (mark._type === 'link' && mark.href) {
                        const href = mark.href;
                        // List of common affiliate domains
                        if (href.includes('rakuten.co.jp') ||
                            href.includes('amazon.co.jp') ||
                            href.includes('amzn.to') ||
                            href.includes('a8.net') ||
                            href.includes('afi-b.com') ||
                            href.includes('px.a8.net') ||
                            href.includes('moshimo.com') ||
                            href.includes('felmat.net') ||
                            href.includes('accesstrade.net') ||
                            href.includes('valuecommerce.ne.jp') ||
                            href.includes('rentracks.jp')) {

                            const text = (block.children || [])
                                .filter(c => c.marks?.includes(mark._key))
                                .map(c => c.text || '')
                                .join('');

                            linksFound.push({
                                blockIndex: index,
                                text: text,
                                href: href
                            });
                        }
                    }
                });
            }
        });

        if (linksFound.length > 0) {
            results.push({
                slug: post.slug?.current,
                title: post.title,
                links: linksFound
            });
        }
    });

    if (results.length > 0) {
        console.log('Articles with text-based affiliate links:');
        results.forEach(res => {
            console.log(`\n[${res.slug}] ${res.title}`);
            res.links.forEach(l => {
                console.log(`  - "${l.text}" -> ${l.href}`);
            });
        });
    } else {
        console.log('No text-based affiliate links found.');
    }
}

auditAllAffiliateLinks().catch(console.error);
