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

function formatLabel(label) {
    if (!label) return '公式サイトをみる ＞';

    // Clean up label
    let cleanLabel = label.trim();

    // Remove complex HTML if accidentally included in label
    cleanLabel = cleanLabel.replace(/<[^>]+>/g, '');

    // Improved Regex to remove any existing "みる", "チェック", "check", arrows, etc. at the end
    // Supports various combinations like "をみる ＞", "チェックする＞", etc.
    const suffixRegex = /[\s＞\>]*([をみたにて]*[みる|チェック|チェックする|確認|購入|check|check it out|公式サイト]+[\s＞\>]*)*[\s＞\>]*$/i;

    cleanLabel = cleanLabel.replace(suffixRegex, '').trim();

    // If it's a known brand, just use the brand name
    if (cleanLabel === '楽天証券をチェックする') cleanLabel = '楽天証券';
    if (cleanLabel.toLowerCase() === 'ahamoをみる') cleanLabel = 'ahamo';

    // Final check for very common repetitions
    cleanLabel = cleanLabel.replace(/をチェックする$/, '');
    cleanLabel = cleanLabel.replace(/をみる$/, '');
    cleanLabel = cleanLabel.replace(/みる$/, '');

    cleanLabel = cleanLabel.trim();

    if (!cleanLabel) return '公式サイトをみる ＞';

    return `${cleanLabel} をみる ＞`;
}

async function fixLabelsOnly() {
    console.log('Fixing redundant labels site-wide...');
    const posts = await client.fetch(`*[_type == "post" && body[].html match "affiliate-btn"]`);

    for (const post of posts) {
        let body = post.body || [];
        let updated = false;

        const newBody = body.map(block => {
            if (block._type === 'htmlEmbed' && block.html && block.html.includes('affiliate-btn')) {
                // Parse label and fix it
                const labelMatch = block.html.match(/>([^<]+)<\/a>/);
                if (labelMatch) {
                    const originalLabel = labelMatch[1].trim();
                    const newLabelText = formatLabel(originalLabel);

                    if (originalLabel !== newLabelText) {
                        updated = true;
                        // Replace only the text part inside the <a> tag
                        const newHtml = block.html.replace(/>([^<]+)<\/a>/, `> ${newLabelText} </a>`);
                        return { ...block, html: newHtml };
                    }
                }
            }
            return block;
        });

        if (updated) {
            console.log(`Cleaning labels in post: ${post.title} (${post.slug?.current})...`);
            await client.patch(post._id).set({ body: newBody }).commit();
        }
    }
    console.log('Label fixing complete.');
}

fixLabelsOnly().catch(console.error);
