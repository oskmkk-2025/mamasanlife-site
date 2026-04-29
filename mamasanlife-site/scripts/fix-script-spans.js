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

async function fixBookkeepingSpans() {
    console.log('Fetching Bookkeeping and FP posts...');
    const posts = await client.fetch(`*[_type == "post" && (title match "*簿記*" || title match "*FP*")]`);

    for (const post of posts) {
        let updated = false;
        let newBody = [];

        for (const block of post.body) {
            if (block._type === 'block' && block.children.some(c => c.text.includes('msmaflink'))) {
                // This block contains a script as text!
                console.log(`Fixing script-as-text in: ${post.title}`);
                const scriptText = block.children.map(c => c.text).join('').trim();

                // Wrap in script tag if not already (though usually it already has it)
                let html = scriptText;
                if (!html.includes('<script')) {
                    html = `<script type="text/javascript">${html}</script>`;
                }

                newBody.push({
                    _type: 'htmlEmbed',
                    _key: block._key || `restore-${Date.now()}`,
                    html: html
                });
                updated = true;
            } else {
                newBody.push(block);
            }
        }

        if (updated) {
            await client.patch(post._id).set({ body: newBody }).commit();
            console.log(`Updated: ${post.title}`);
        }
    }
}

fixBookkeepingSpans().catch(console.error);
