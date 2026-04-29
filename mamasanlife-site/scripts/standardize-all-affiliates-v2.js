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

// Mapping for known internal redirects (identified from 5gb_post.json and browser check)
const redirectMap = {
    '/money/ejp': 'https://px.a8.net/svt/ejp?a8mat=3Z96BG+3E1VSI+4TIO+5YJRM', // ahamo (or Rakuten, but 5gb post uses this for ahamo)
    '/money/cc': 'https://h.accesstrade.net/sp/cc?rk=0100ok1d00nxsq', // HIS Mobile
    '/money/area': 'https://network.mobile.rakuten.co.jp/area/', // Rakuten Area
    '/money/in': 'https://blogmura.com/profiles/11159291/', // Blogmura fallback
    '/money/link': 'https://blog.with2.net/link/?id=2097059', // With2 fallback
};

function getProviderClass(href) {
    if (href.includes('amazon.co.jp') || href.includes('amzn.to')) return 'amazon';
    if (href.includes('rakuten.co.jp')) return 'rakuten';
    if (href.includes('px.a8.net') || href.includes('a8mat')) return 'a8';
    if (href.includes('moshimo.com')) return 'moshimo';
    if (href.includes('afi-b.com') || href.includes('kurashi-m.jp')) return 'afb';
    if (href.includes('valuecommerce.ne.jp')) return 'valuecommerce';
    if (href.includes('yahoo.co.jp')) return 'yahoo';
    if (href.includes('accesstrade.net')) return 'a8'; // Use a8-like style for other ASPs if needed
    return 'others';
}

function extractCorrectUrl(href) {
    // 1. Handle common redirect patterns if present
    if (redirectMap[href]) {
        return redirectMap[href];
    }

    // 2. Handle broken links like "http://<a href=\"https://...\"..."
    if (href && href.includes('<a href="')) {
        const match = href.match(/href="([^"]+)"/);
        if (match) return match[1];
    }

    // 3. Fix potential internal-looking links even if not in map
    if (href && href.startsWith('/money/') && !redirectMap[href]) {
        console.log(`Warning: Unmapped internal link: ${href}`);
    }

    return href;
}

function formatLabel(label) {
    if (!label) return '公式サイトをみる ＞';

    // Remove existing suffix to avoid repetition
    let cleanLabel = label.replace(/をみる\s*＞?$/, '').replace(/みる\s*＞?$/, '').trim();

    // Special cases: if it's already a full clear label
    if (cleanLabel.endsWith('ボタン')) return cleanLabel;

    return `${cleanLabel} をみる ＞`;
}

async function standardizeAllAffiliates() {
    console.log('Fetching all posts for site-wide affiliate standardization (REFINED)...');
    const posts = await client.fetch(`*[_type == "post"]`);

    for (const post of posts) {
        let body = post.body || [];
        let updated = false;

        const newBody = body.map(block => {
            // Case 1: HTML Embeds - check for broken links in existing HTML
            if (block._type === 'htmlEmbed') {
                if (block.html && block.html.includes('<a href="http://<a href=')) {
                    // This is a doubly broken link
                    const match = block.html.match(/href="([^"]+)"/);
                    if (match) {
                        const correctUrl = match[1];
                        const provider = getProviderClass(correctUrl);
                        const labelMatch = block.html.match(/>([^<]+)<\/a>/);
                        const label = labelMatch ? labelMatch[1] : '公式サイトをみる';
                        updated = true;
                        return {
                            ...block,
                            html: `<a class="affiliate-btn affiliate-btn--${provider}" href="${correctUrl}" rel="nofollow sponsored"> ${formatLabel(label)} </a>`
                        };
                    }
                }

                // Also fix redundant text in existing buttons if any
                if (block.html?.includes('をみる をみる')) {
                    updated = true;
                    return {
                        ...block,
                        html: block.html.replace(/をみる をみる ＞/g, 'をみる ＞')
                    };
                }
            }

            // Case 2: Text blocks with affiliate links
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
                        href.includes('rentracks.jp') ||
                        href.startsWith('/money/'); // Include internal ones
                });

                if (hasAffiliateMark) {
                    const buttons = [];
                    block.markDefs.forEach(m => {
                        if (m._type === 'link' && m.href) {
                            const correctUrl = extractCorrectUrl(m.href);

                            // Skip if it's strictly a blogmura in/out link we want to keep as text (though user said ALL)
                            // But for now, let's treat /money/in as worth buttonizing if it's being targeted.

                            const provider = getProviderClass(correctUrl);
                            const label = (block.children || [])
                                .filter(c => c.marks?.includes(m._key))
                                .map(c => c.text || '')
                                .join('').trim();

                            if (label) {
                                buttons.push(`<a class="affiliate-btn affiliate-btn--${provider}" href="${correctUrl}" rel="nofollow sponsored"> ${formatLabel(label)} </a>`);
                            }
                        }
                    });

                    if (buttons.length > 0) {
                        updated = true;
                        return {
                            _type: 'htmlEmbed',
                            _key: block._key + '_standardized_v2',
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
    console.log('Site-wide standardization (REFINED) complete.');
}

standardizeAllAffiliates().catch(console.error);
