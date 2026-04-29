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
    // 1. kkr-kenko-points (Nn6Sc6MF3u71woMpYvaOQr)
    const kkrPost = await client.getDocument('Nn6Sc6MF3u71woMpYvaOQr');
    if (kkrPost) {
        let body = kkrPost.body;
        // Fix broken link slug "新しいタブで開く"
        body = body.map(block => {
            if (block.markDefs) {
                block.markDefs = block.markDefs.map(def => {
                    if (def.href === "/health/e6-96-b0-e3-81-97-e3-81-84-e3-82-bf-e3-83-96-e3-81-a7-e9-96-8b-e3-81-8f") {
                        return { ...def, href: "/health/rakuten-healthcare" };
                    }
                    return def;
                });
            }
            if (block.children) {
                block.children = block.children.map(child => {
                    if (child.text === "https://mamasanmoney-bu.com/rakuten-healthcare/") {
                        return { ...child, text: "楽天ヘルスケア" };
                    }
                    return child;
                });
            }
            return block;
        });

        // Fix Apple Health / Google Fit section
        const xKey = "dd0b487aadbc"; // ✖️ block
        const textBlockKey = "0c01e0096df6";

        const xIdx = body.findIndex(b => b._key === xKey);
        if (xIdx !== -1) {
            body.splice(xIdx, 1); // Remove ✖️
        }

        const tIdx = body.findIndex(b => b._key === textBlockKey);
        if (tIdx !== -1) {
            const combinedBlock = body[tIdx];
            const children = combinedBlock.children;

            // Split into Apple Health part, "もしくは", and Google Fit part
            const appleSpans = children.slice(0, 12);
            const orSpans = children.slice(12, 18);
            const googleSpans = children.slice(18);

            const appleBlock = { ...combinedBlock, _key: "block-apple-health", children: appleSpans };
            const orBlock = { ...combinedBlock, _key: "block-or", children: orSpans, style: "normal" };
            const googleBlock = { ...combinedBlock, _key: "block-google-fit", children: googleSpans };

            // Re-insert blocks
            // Current sequence near tIdx after splicing x: 
            // Image(Apple), Row(Store), Image(Fit), Row(Play), CombinedText
            // We want:
            // Image(Apple), Row(Store), AppleText, OR, Image(Fit), Row(Play), FitText

            // Find the indices of the images and rows
            const imgAppleIdx = body.findIndex(b => b._key === "69ca03bf7979");
            const rowStoreIdx = body.findIndex(b => b._key === "e65094dcd6ca");
            const imgFitIdx = body.findIndex(b => b._key === "6ecbf7809fe6");
            const rowPlayIdx = body.findIndex(b => b._key === "e173c6d77771");
            const combinedIdx = body.findIndex(b => b._key === textBlockKey);

            // We'll rebuild this part of the array
            const newItems = [
                body[imgAppleIdx],
                body[rowStoreIdx],
                appleBlock,
                orBlock,
                body[imgFitIdx],
                body[rowPlayIdx],
                googleBlock
            ].filter(Boolean);

            // Splice them in
            const start = Math.min(imgAppleIdx, rowStoreIdx, imgFitIdx, rowPlayIdx, combinedIdx);
            const end = Math.max(imgAppleIdx, rowStoreIdx, imgFitIdx, rowPlayIdx, combinedIdx);
            body.splice(start, end - start + 1, ...newItems);
        }

        await client.patch(kkrPost._id).set({ body }).commit();
        console.log('Fixed kkr-kenko-points');
    }

    // 2. rakuten-mercari (Nn6Sc6MF3u71woMpYvaP73)
    const mercariPost = await client.getDocument('Nn6Sc6MF3u71woMpYvaP73');
    if (mercariPost) {
        let body = mercariPost.body;
        body = body.map(block => {
            if (block.markDefs) {
                block.markDefs = block.markDefs.map(def => {
                    if (def.href === "/money/312173-389657") {
                        return { ...def, href: "https://www.rakuten-sec.co.jp/" };
                    }
                    return def;
                });
            }
            return block;
        });
        await client.patch(mercariPost._id).set({ body }).commit();
        console.log('Fixed rakuten-mercari');
    }

    // 3. smartphone-for-junior-high-school-students (Nn6Sc6MF3u71woMpYvaSQk)
    const juniorHighPost = await client.getDocument('Nn6Sc6MF3u71woMpYvaSQk');
    if (juniorHighPost) {
        let body = juniorHighPost.body;
        body = body.map(block => {
            if (block.markDefs) {
                block.markDefs = block.markDefs.map(def => {
                    if (def.href === "/parenting/m0000000934") {
                        return { ...def, href: "https://kakaku.com/" };
                    }
                    return def;
                });
            }
            return block;
        });
        await client.patch(juniorHighPost._id).set({ body }).commit();
        console.log('Fixed junior-high');
    }

    // 4. rakuten-healthcare (Nn6Sc6MF3u71woMpYvaOrE) - Clean double encoding
    const healthPost = await client.getDocument('Nn6Sc6MF3u71woMpYvaOrE');
    if (healthPost) {
        let body = healthPost.body;
        body = body.map(block => {
            if (block._type === 'linkImageRow' && block.items) {
                block.items = block.items.map(item => {
                    if (item.href && item.href.includes('%25')) {
                        return { ...item, href: decodeURIComponent(item.href) };
                    }
                    return item;
                });
            }
            return block;
        });
        await client.patch(healthPost._id).set({ body }).commit();
        console.log('Fixed rakuten-healthcare encoding');
    }
}

runFixes().catch(console.error);
