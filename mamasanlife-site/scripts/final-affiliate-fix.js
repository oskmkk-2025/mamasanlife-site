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

const ENECHANGE_HTML = `
<a class="affiliate-btn affiliate-btn--a8" href="https://px.a8.net/svt/ejp?a8mat=3ZJZJ2+1RPEIA+4CJ0+60H7M" rel="nofollow sponsored">国内最大級の電力比較サイト【エネチェンジ】をみる ＞</a><img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=3ZJZJ2+1RPEIA+4CJ0+60H7M" alt="">
`;

const TERASEL_END_TEXT = '紹介特典つき申込は終了しています';

async function finalFix() {
    console.log('Fetching posts for final TERASEL and Enechange fix...');
    const slugs = ['chubu-electric-powers-fuel-cost-adjustment-upper-limit', 'review-of-utility-costs'];
    const posts = await client.fetch(`*[_type == "post" && slug.current in $slugs]`, { slugs });

    for (const post of posts) {
        console.log(`Processing: ${post.title} (${post.slug.current})`);
        let body = [...post.body];
        let updated = false;

        const newBody = [];
        for (const block of body) {
            // TERASEL removal
            if (block._type === 'htmlEmbed' && block.html.includes('elswebapplication')) {
                console.log('Replacing TERASEL button with text...');
                newBody.push({
                    _type: 'block',
                    _key: block._key + '_terasel_end',
                    style: 'normal',
                    children: [{
                        _type: 'span',
                        _key: block._key + '_span',
                        text: TERASEL_END_TEXT,
                        marks: ['strong']
                    }]
                });
                updated = true;
                continue;
            }

            // Enechange update
            if (block._type === 'htmlEmbed' && block.html.includes('エネチェンジ')) {
                console.log('Updating Enechange link...');
                newBody.push({
                    ...block,
                    html: ENECHANGE_HTML.trim()
                });
                updated = true;
                continue;
            }

            newBody.push(block);
        }

        if (updated) {
            await client.patch(post._id).set({ body: newBody }).commit();
            console.log(`Updated: ${post.title}`);
        } else {
            console.log(`No changes needed for: ${post.title}`);
        }
    }

    console.log('Final fix completed.');
}

finalFix().catch(console.error);
