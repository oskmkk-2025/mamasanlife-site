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

        // Add "posted with アプリーチ" to the blocks so they are identified by groupAppreachBlocks
        body = body.map(block => {
            if (block._key === 'block-apple-health') {
                return {
                    ...block,
                    children: [
                        { _key: 'c1', _type: 'span', marks: [], text: 'Apple ヘルスケア ' },
                        { _key: 'c2', _type: 'span', marks: [], text: 'posted with ' },
                        { _key: 'c3', _type: 'span', marks: ['m-appreach'], text: 'アプリーチ' }
                    ],
                    markDefs: [
                        { _key: 'm-appreach', _type: 'link', href: 'https://mamasanmoney-bu.com/health/app-reach' }
                    ]
                };
            }
            if (block._key === 'block-google-fit') {
                return {
                    ...block,
                    children: [
                        { _key: 'g1', _type: 'span', marks: [], text: 'Google Fit: アクティビティ記録 ' },
                        { _key: 'g2', _type: 'span', marks: [], text: 'posted with ' },
                        { _key: 'g3', _type: 'span', marks: ['m-appreach-g'], text: 'アプリーチ' }
                    ],
                    markDefs: [
                        { _key: 'm-appreach-g', _type: 'link', href: 'https://mamasanmoney-bu.com/health/app-reach' }
                    ]
                };
            }
            return block;
        });

        await client.patch(kkrPost._id).set({ body }).commit();
        console.log('Fixed grouping by adding 아프리치 tags');
    }
}

runFixes().catch(console.error);
