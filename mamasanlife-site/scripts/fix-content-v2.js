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

        // 1. Remove redundancy and clean up blocks
        body = body.map(block => {
            if (block._key === 'block-apple-health') {
                return {
                    ...block,
                    children: [
                        {
                            _key: 'child-1',
                            _type: 'span',
                            marks: [],
                            text: 'Apple ヘルスケア'
                        }
                    ]
                };
            }
            if (block._key === 'block-google-fit') {
                return {
                    ...block,
                    children: [
                        {
                            _key: 'child-2',
                            _type: 'span',
                            marks: [],
                            text: 'Google Fit: アクティビティ記録'
                        }
                    ]
                };
            }
            if (block._key === 'block-or') {
                return {
                    ...block,
                    children: [
                        {
                            _key: 'child-or',
                            _type: 'span',
                            marks: [],
                            text: 'もしくは'
                        }
                    ]
                };
            }
            return block;
        });

        // 2. Ensure they are in a sequence that the grouper likes
        // Image, Row, Block
        // Find them again
        const imgApple = body.find(b => b.alt === 'Apple ヘルスケア' && b._type === 'image');
        const rowApple = body.find(b => b._type === 'linkImageRow' && b.items?.some(it => it.href?.includes('id1242545199')));
        const blkApple = body.find(b => b._key === 'block-apple-health');
        const blkOr = body.find(b => b._key === 'block-or');
        const imgFit = body.find(b => b.alt === 'Google Fit: アクティビティ記録' && b._type === 'image');
        const rowFit = body.find(b => b._type === 'linkImageRow' && b.items?.some(it => it.href?.includes('fitness')));
        const blkFit = body.find(b => b._key === 'block-google-fit');

        // Filter out these blocks from original body
        const filteredBody = body.filter(b => ![imgApple, rowApple, blkApple, blkOr, imgFit, rowFit, blkFit].includes(b));

        // Find where they were (near the h2 'タニタヘルスケアアプリとの連携')
        const targetH2Idx = filteredBody.findIndex(b => b.style === 'h2' && (b.children || []).some(c => c.text?.includes('タニタ')));

        if (targetH2Idx !== -1) {
            // Insert after h2 + next paragraph
            filteredBody.splice(targetH2Idx + 2, 0, imgApple, rowApple, blkApple, blkOr, imgFit, rowFit, blkFit);
            body = filteredBody;
        }

        await client.patch(kkrPost._id).set({ body }).commit();
        console.log('Refined kkr-kenko-points');
    }
}

runFixes().catch(console.error);
