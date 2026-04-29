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

function getProviderClass(href) {
    if (href.includes('amazon.co.jp') || href.includes('amzn.to')) return 'amazon';
    if (href.includes('rakuten.co.jp')) return 'rakuten';
    if (href.includes('px.a8.net') || href.includes('a8mat')) return 'a8';
    if (href.includes('moshimo.com')) return 'moshimo';
    if (href.includes('afi-b.com') || href.includes('kurashi-m.jp')) return 'afb';
    if (href.includes('valuecommerce.ne.jp')) return 'valuecommerce';
    if (href.includes('yahoo.co.jp')) return 'yahoo';
    return 'others';
}

function extractCorrectUrl(href) {
    // Handle broken links like "http://<a href=\"https://...\"..."
    if (href.includes('<a href="')) {
        const match = href.match(/href="([^"]+)"/);
        if (match) return match[1];
    }
    return href;
}

async function standardizeAllAffiliates() {
    console.log('Fetching all posts for site-wide affiliate standardization...');
    const posts = await client.fetch(`*[_type == "post"]`);

    for (const post of posts) {
        let body = post.body || [];
        let updated = false;

        const newBody = body.map(block => {
            // Case 1: Existing HTML Embeds that are Kurashi or other affiliates - already handled mostly, 
            // but let's ensure they have the right classes if we find others.
            if (block._type === 'htmlEmbed') {
                // If it looks like an affiliate link but missing class
                if (block.html?.includes('afi-b.com') || block.html?.includes('rakuten') || block.html?.includes('amazon') || block.html?.includes('px.a8.net')) {
                    if (!block.html.includes('affiliate-btn')) {
                        // We might want to fix these too, but let's focus on text links first.
                    }
                }
            }

            // Case 2: Text blocks with links to affiliate domains
            if (block._type === 'block') {
                const hasAffiliateMark = block.markDefs?.some(m => {
                    const href = m.href || '';
                    return href.includes('rakuten.co.jp') ||
                        href.includes('amazon.co.jp') ||
                        href.includes('amzn.to') ||
                        href.includes('a8.net') ||
                        href.includes('afi-b.com') ||
                        href.includes('moshimo.com') ||
                        href.includes('felmat.net') ||
                        href.includes('accesstrade.net') ||
                        href.includes('valuecommerce.ne.jp') ||
                        href.includes('rentracks.jp');
                });

                if (hasAffiliateMark) {
                    // Extract labels and links
                    // For simplicity, if a block has an affiliate link, we convert the whole block to buttons
                    // One button per link in the block
                    const buttons = [];
                    block.markDefs.forEach(m => {
                        if (m._type === 'link' && m.href) {
                            const rawHref = m.href;
                            const correctUrl = extractCorrectUrl(rawHref);
                            const provider = getProviderClass(correctUrl);

                            // Get the text for this specific link
                            const label = (block.children || [])
                                .filter(c => c.marks?.includes(m._key))
                                .map(c => c.text || '')
                                .join('').trim() || '公式サイトをみる';

                            const finalLabel = label.endsWith('＞') ? label : `${label} をみる ＞`;

                            buttons.push(`<a class="affiliate-btn affiliate-btn--${provider}" href="${correctUrl}" rel="nofollow sponsored"> ${finalLabel} </a>`);
                        }
                    });

                    if (buttons.length > 0) {
                        updated = true;
                        return {
                            _type: 'htmlEmbed',
                            _key: block._key + '_standardized',
                            html: buttons.join('\n')
                        };
                    }
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
    console.log('Site-wide standardization complete.');
}

standardizeAllAffiliates().catch(console.error);
