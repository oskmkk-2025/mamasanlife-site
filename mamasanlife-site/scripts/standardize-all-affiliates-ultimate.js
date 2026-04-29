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

// Global Mapping for known internal redirects
const globalRedirectMap = {
    '/money/ejp': 'https://px.a8.net/svt/ejp?a8mat=3Z96BG+3E1VSI+4TIO+5YJRM', // ahamo
    '/money/cc': 'https://h.accesstrade.net/sp/cc?rk=0100ok1d00nxsq', // HIS Mobile
    '/money/area': 'https://network.mobile.rakuten.co.jp/area/', // Rakuten Area
    '/money/in': 'https://blogmura.com/profiles/11159291/',
    '/money/link': 'https://blog.with2.net/link/?id=2097059',
    '/money/312173-389657': 'https://ad2.trafficgate.net/t/r/1029/738/312173_389657', // Rakuten Securities
};

function getProviderClass(href) {
    if (href.includes('amazon.co.jp') || href.includes('amzn.to')) return 'amazon';
    if (href.includes('rakuten.co.jp')) return 'rakuten';
    if (href.includes('px.a8.net') || href.includes('a8mat')) return 'a8';
    if (href.includes('moshimo.com')) return 'moshimo';
    if (href.includes('afi-b.com') || href.includes('kurashi-m.jp')) return 'afb';
    if (href.includes('valuecommerce.ne.jp')) return 'valuecommerce';
    if (href.includes('yahoo.co.jp')) return 'yahoo';
    if (href.includes('trafficgate.net') || href.includes('accesstrade.net')) return 'a8';
    return 'others';
}

function extractCorrectUrl(href, localMap = {}) {
    // 1. Check local map first
    if (localMap[href]) return localMap[href];

    // 2. Check global map
    if (globalRedirectMap[href]) return globalRedirectMap[href];

    // 3. Handle broken links like "http://<a href=\"https://...\"..."
    if (href && href.includes('<a href="')) {
        const match = href.match(/href="([^"]+)"/);
        if (match) return match[1];
    }

    // 4. Handle escaped HTML variants
    if (href && href.includes('&lt;a href=&quot;')) {
        const match = href.match(/&quot;([^&]+)&quot;/);
        if (match) return match[1];
    }

    return href;
}

function formatLabel(label) {
    if (!label) return '公式サイトをみる ＞';

    // Clean up label
    let cleanLabel = label.trim();

    // Remove complex HTML if accidentally included in label
    cleanLabel = cleanLabel.replace(/<[^>]+>/g, '');

    // Remove "をみる", "みる", "チェックする" etc at the end to avoid duplication
    // Also remove "＞"
    cleanLabel = cleanLabel.replace(/[\s＞\>]*$/, '');
    cleanLabel = cleanLabel.replace(/をみる$/, '');
    cleanLabel = cleanLabel.replace(/みる$/, '');
    cleanLabel = cleanLabel.replace(/をチェック$/, '');
    cleanLabel = cleanLabel.replace(/チェックする$/, '');
    cleanLabel = cleanLabel.replace(/公式サイト$/, '');

    cleanLabel = cleanLabel.trim();

    if (!cleanLabel) return '公式サイトをみる ＞';

    return `${cleanLabel} をみる ＞`;
}

async function standardizeAllAffiliates() {
    console.log('Fetching all posts for ultimate affiliate standardization...');
    const posts = await client.fetch(`*[_type == "post"]`);

    for (const post of posts) {
        // Build local map from affiliateBlocks
        const localMap = {};
        if (post.affiliateBlocks) {
            post.affiliateBlocks.forEach(blk => {
                if (blk.html) {
                    const match = blk.html.match(/href="([^"]+)"/);
                    if (match) {
                        const url = match[1];
                        // If the text in affiliate blocks matches a keyword, we might use it.
                        // But more importantly, if we find a URL that looks like an affiliate link, we store it.
                        if (blk.title) localMap[blk.title] = url;
                    }
                }
            });
        }

        let body = post.body || [];
        let updated = false;

        const newBody = body.map(block => {
            // Case 1: HTML Embeds (Fix existing ones including my previous faulty ones)
            if (block._type === 'htmlEmbed') {
                if (block.html && (block.html.includes('affiliate-btn') || block.html.includes('px.a8.net') || block.html.includes('moshimo'))) {
                    // Re-parse and fix URLs and labels
                    // Extract URL
                    const hrefMatch = block.html.match(/href="([^"]+)"/);
                    if (hrefMatch) {
                        const rawHref = hrefMatch[1];
                        const correctUrl = extractCorrectUrl(rawHref, localMap);
                        const provider = getProviderClass(correctUrl);

                        // Extract Label
                        const labelMatch = block.html.match(/>([^<]+)<\/a>/);
                        let label = labelMatch ? labelMatch[1] : '公式サイトをみる';

                        const newHtml = `<a class="affiliate-btn affiliate-btn--${provider}" href="${correctUrl}" rel="nofollow sponsored"> ${formatLabel(label)} </a>`;

                        if (block.html !== newHtml) {
                            updated = true;
                            return { ...block, html: newHtml };
                        }
                    }
                }
            }

            // Case 2: Text blocks with links
            if (block._type === 'block') {
                const hasAffiliateMark = block.markDefs?.some(m => {
                    const href = m.href || '';
                    return href.includes('rakuten.co.jp') ||
                        href.includes('amazon.co.jp') ||
                        href.includes('amzn.to') ||
                        href.includes('a8.net') ||
                        href.includes('afi-b.com') ||
                        href.includes('moshimo.com') ||
                        href.includes('trafficgate.net') ||
                        href.includes('accesstrade.net') ||
                        href.startsWith('/money/');
                });

                if (hasAffiliateMark) {
                    const buttons = [];
                    block.markDefs.forEach(m => {
                        if (m._type === 'link' && m.href) {
                            const correctUrl = extractCorrectUrl(m.href, localMap);
                            const provider = getProviderClass(correctUrl);
                            const label = (block.children || [])
                                .filter(c => c.marks?.includes(m._key))
                                .map(c => c.text || '')
                                .join('').trim();

                            if (label || correctUrl.includes('/money/')) {
                                buttons.push(`<a class="affiliate-btn affiliate-btn--${provider}" href="${correctUrl}" rel="nofollow sponsored"> ${formatLabel(label)} </a>`);
                            }
                        }
                    });

                    if (buttons.length > 0) {
                        updated = true;
                        // Replace the WHOLE block with buttons if it primarily contained affiliate links
                        // If it has other text, we might want to be more careful, but user said "convert all text based links"
                        return {
                            _type: 'htmlEmbed',
                            _key: block._key + '_ultimate_fix',
                            html: buttons.join('\n')
                        };
                    }
                }
            }
            return block;
        });

        if (updated) {
            console.log(`Updating post: ${post.title} (${post.slug?.current})...`);
            try {
                await client.patch(post._id).set({ body: newBody }).commit();
            } catch (err) {
                console.error(`Failed to update ${post.slug?.current}:`, err.message);
            }
        }
    }
    console.log('Ultimate standardization complete.');
}

standardizeAllAffiliates().catch(console.error);
