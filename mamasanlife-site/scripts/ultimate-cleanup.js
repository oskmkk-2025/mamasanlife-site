const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
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

async function ultimateFix() {
    console.log('Starting ultimate site-wide cleanup...');
    const posts = await client.fetch(`*[_type == "post"]`);
    console.log(`Auditing ${posts.length} posts.`);

    for (const post of posts) {
        let updated = false;
        if (!post.body) continue;
        let newBody = [];

        for (const block of post.body) {
            let newBlock = JSON.parse(JSON.stringify(block));

            // Fix 1: Kurashi no Market labels (Fixing truncation)
            if (newBlock._type === 'htmlEmbed' && newBlock.html.includes('くらしのマーケ')) {
                const oldHtml = newBlock.html;
                newBlock.html = oldHtml.replace(/くらしのマーケ\s*をみる/g, 'くらしのマーケットをみる')
                    .replace(/くらしのマーケ/g, 'くらしのマーケット');
                if (newBlock.html !== oldHtml) {
                    updated = true;
                    console.log(`[FIX 1] Corrected Kurashi label in: ${post.title}`);
                }
            }

            // Fix 2: Script-as-text (Bookkeeping/FP)
            if (newBlock._type === 'block') {
                const combinedText = (newBlock.children || []).map(c => c.text).join('');
                if (combinedText.includes('msmaflink')) {
                    console.log(`[FIX 2] Converting script-as-text to htmlEmbed in: ${post.title}`);
                    // Reconstruct the script
                    let scriptContent = combinedText.trim();
                    if (!scriptContent.includes('<script')) {
                        scriptContent = `<script type="text/javascript">\n${scriptContent}\n</script>\n<div id="msmaflink-${scriptContent.match(/eid":"([^"]+)"/)?.[1] || 'restore'}">リンク</div>`;
                    }
                    newBlock = {
                        _type: 'htmlEmbed',
                        _key: newBlock._key || `restore-${Date.now()}`,
                        html: scriptContent
                    };
                    updated = true;
                }
            }

            // Fix 3: Nippon Tsushin SIM Image
            if (newBlock._type === 'htmlEmbed' && newBlock.html.includes('NT-ST2-P') && newBlock.html.includes('41s3bpWFrPL')) {
                const oldHtml = newBlock.html;
                // Replace broken image ID with known good one
                newBlock.html = oldHtml.replace('41s3bpWFrPL', '51+xe2eux3L');
                if (newBlock.html !== oldHtml) {
                    updated = true;
                    console.log(`[FIX 3] Fixed Nippon Tsushin image URL in: ${post.title}`);
                }
            }

            newBody.push(newBlock);
        }

        if (updated) {
            try {
                await client.patch(post._id).set({ body: newBody }).commit();
                console.log(`Successfully updated: ${post.title}`);
            } catch (e) {
                console.error(`Failed to update ${post.title}: ${e.message}`);
            }
        }
    }
    console.log('Ultimate cleanup completed.');
}

ultimateFix().catch(console.error);
