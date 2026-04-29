const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

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

const CORRECT_URL = 'https://t.afi-b.com/visit.php?a=G142682-w468243f&p=x929565W';
const NEW_LABEL = 'くらしのマーケットをみる ＞';
const NEW_CLASS = 'affiliate-btn affiliate-btn--curama';

async function revertKurashiUrl() {
    console.log('Reverting Kurashi no Market URLs...');

    const posts = await client.fetch(`*[_type == "post" && body[].html match "*くらしのマーケット*"]`);
    console.log(`Found ${posts.length} posts to check.`);

    for (const post of posts) {
        let updated = false;
        let body = post.body.map(block => {
            if (block._type === 'htmlEmbed' && block.html.includes('くらしのマーケット')) {
                // Replace A8 link or any other link with correct afi-b link
                // And update the class and label
                let newHtml = block.html.replace(/href="[^"]*"/, `href="${CORRECT_URL}"`);
                newHtml = newHtml.replace(/class="[^"]*"/, `class="${NEW_CLASS}"`);

                // Keep the label simple if it was truncated/duplicated before
                newHtml = newHtml.replace(/>[^<]*<\/a>/, `>${NEW_LABEL}</a>`);

                if (newHtml !== block.html) {
                    updated = true;
                    return { ...block, html: newHtml };
                }
            }
            return block;
        });

        if (updated) {
            await client.patch(post._id).set({ body }).commit();
            console.log(`Updated: ${post.title}`);
        }
    }

    console.log('Reversion completed.');
}

revertKurashiUrl().catch(console.error);
