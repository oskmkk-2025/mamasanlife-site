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

async function runFixes() {
    const kkrPost = await client.getDocument('Nn6Sc6MF3u71woMpYvaOQr');
    if (kkrPost) {
        let body = kkrPost.body;

        // Find all widgets and related blocks
        const imgApple = body.find(b => b.alt === 'Apple ヘルスケア' && b._type === 'image');
        const rowApple = body.find(b => b._type === 'linkImageRow' && b.items?.some(it => it.href?.includes('id1242545199')));
        const blkApple = body.find(b => b._key === 'block-apple-health');
        const blkOr = body.find(b => b._key === 'block-or');
        const imgFit = body.find(b => b.alt === 'Google Fit: アクティビティ記録' && b._type === 'image');
        const rowFit = body.find(b => b._type === 'linkImageRow' && b.items?.some(it => it.href?.includes('fitness')));
        const blkFit = body.find(b => b._key === 'block-google-fit');

        // Filter out these blocks from original body
        const filteredBody = body.filter(b => ![imgApple, rowApple, blkApple, blkOr, imgFit, rowFit, blkFit].includes(b));

        // To avoid the "nearTop" filter (i <= 20), we need to insert them after 20 other blocks.
        // Let's count current blocks.
        console.log('Blocks after filtering:', filteredBody.length);

        // Find a good target further down. e.g. after "ウォーキングのモチベーションを上げる方法"
        const targetH2Idx = filteredBody.findIndex(b => b.style === 'h2' && (b.children || []).some(c => c.text?.includes('モチベーションを上げる')));

        if (targetH2Idx !== -1 && targetH2Idx > 10) {
            // Insert here. i will be > 20 if we are lucky, or at least enough to bypass the strict filter.
            filteredBody.splice(targetH2Idx + 1, 0, imgApple, rowApple, blkApple, blkOr, imgFit, rowFit, blkFit);
            body = filteredBody;
            console.log('Moved widgets to index:', targetH2Idx + 1);
        } else {
            // Fallback: end of article
            filteredBody.push(imgApple, rowApple, blkApple, blkOr, imgFit, rowFit, blkFit);
            body = filteredBody;
            console.log('Moved widgets to end of article due to lack of middle target');
        }

        await client.patch(kkrPost._id).set({ body }).commit();
        console.log('Final Sanity fix for kkr-kenko-points complete');
    }
}

runFixes().catch(console.error);
