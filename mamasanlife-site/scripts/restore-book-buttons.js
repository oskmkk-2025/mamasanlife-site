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

const MOSHIMO_WRAPPER = `(function(b,c,f,g,a,d,e){b.MoshimoAffiliateObject=a;
b[a]=b[a]||function(){arguments.currentScript=c.currentScript
||c.scripts[c.scripts.length-2];(b[a].q=b[a].q||[]).push(arguments)};
c.getElementById(a)||(d=c.createElement(f),d.src=g,
d.id=a,e=c.getElementsByTagName("body")[0],e.appendChild(d))})
(window,document,"script","//dn.msmstatic.com/site/cardlink/bundle.js?20220329","msmaflink");`;

async function restoreBookkeepingButtons() {
    console.log('Restoring bookkeeping buttons...');

    const slug = 'qualification-nissho-bookkeeping3-test';
    const post = await client.fetch(`*[_type == "post" && slug.current == "${slug}"][0]`);

    if (!post) {
        console.log('Post not found');
        return;
    }

    let updated = false;
    let body = post.body.map(block => {
        if (block._type === 'htmlEmbed' && block.html.includes('msmaflink')) {
            const html = block.html;
            // Check for multiple msmaflink calls
            const matches = html.match(/msmaflink\(\{[\s\S]*?\}\);/g);
            if (matches && matches.length > 0) {
                console.log(`Found ${matches.length} msmaflink calls in block ${block._key}`);

                let newHtml = '';
                // Handle text before the first script
                const startText = html.split('<script')[0].trim();
                if (startText && !startText.startsWith('<') && startText !== '日商簿記３級') {
                    newHtml += `<p>${startText}</p>\n`;
                } else if (html.includes('日商簿記３級')) {
                    newHtml += `<h3>日商簿記３級</h3>\n`;
                }

                matches.forEach(m => {
                    // Extract eid
                    const eidMatch = m.match(/"eid":"(.*?)"/);
                    const eid = eidMatch ? eidMatch[1] : null;

                    newHtml += `<script type="text/javascript">\n${MOSHIMO_WRAPPER}\n${m}\n</script>\n`;
                    if (eid) {
                        newHtml += `<div id="msmaflink-${eid}">リンク</div>\n`;
                    } else {
                        newHtml += `<div id="msmaflink-restore-${Date.now()}">リンク</div>\n`;
                    }
                });

                if (newHtml !== html) {
                    updated = true;
                    return { ...block, html: newHtml };
                }
            }
        }
        return block;
    });

    if (updated) {
        await client.patch(post._id).set({ body }).commit();
        console.log('Post updated successfully!');
    } else {
        console.log('No updates needed for this post.');
    }
}

restoreBookkeepingButtons().catch(console.error);
