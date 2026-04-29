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

async function updateKurashiArticles() {
    const slugs = [
        'house-cleaning-washing-machine',
        'install-a-built-in-stove',
        'bathroom-cleaning',
        'house-cleaning-air-conditioner'
    ];

    const kurashiHtml = `<a href="https://t.afi-b.com/visit.php?a=G142682-w468243f&p=x929565W" rel="nofollow">くらしのマーケット</a><img src="https://t.afi-b.com/lead/G142682/x929565W/w468243f" width="1" height="1" style="border:none;" />`;

    for (const slug of slugs) {
        console.log(`Processing ${slug}...`);
        const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug });
        if (!post) {
            console.error(`Post not found: ${slug}`);
            continue;
        }

        // 1. Update Tags
        let tags = post.tags || [];
        if (!tags.includes('くらしのマーケット')) {
            tags.push('くらしのマーケット');
        }

        // 2. Update Body (replace links)
        let body = post.body || [];
        let updated = false;

        const newBody = body.map(block => {
            if (block._type === 'block') {
                const textCombined = (block.children || []).map(c => c.text || '').join('');
                if (textCombined.includes('くらしのマーケットをみる')) {
                    updated = true;
                    return {
                        _type: 'htmlEmbed',
                        _key: block._key + '_html',
                        html: kurashiHtml
                    };
                }
            }
            return block;
        });

        await client.patch(post._id)
            .set({ tags, body: newBody })
            .commit();
        console.log(`Updated ${slug} (Tag added, Body updated: ${updated})`);
    }
}

async function updateMnpArticle() {
    const slug = 'mobile-number-portability';
    const moshimoHtml = `<!-- START MoshimoAffiliateEasyLink -->
<script type="text/javascript">
(function(b,c,f,g,a,d,e){b.MoshimoAffiliateObject=a;
b[a]=b[a]||function(){arguments.currentScript=c.currentScript
||c.scripts[c.scripts.length-2];(b[a].q=b[a].q||[]).push(arguments)};
c.getElementById(a)||(d=c.createElement(f),d.src=g,
d.id=a,e=c.getElementsByTagName("body")[0],e.appendChild(d))})
(window,document,"script","//dn.msmstatic.com/site/cardlink/bundle.js?20220329","msmaflink");
msmaflink({"n":"【日本通信SIM】音声対応：合理的（シンプル290プラン、みんなのプラン、50GBプラン、他）またはデータ通信専用：（ネットだけプラン）から選んでお申込みいただける新スターターパック NT-ST2-P ドコモネットワーク 4G\\/3G","b":"アイサポモバイル","t":"NT-ST2-P2","d":"https:\\/\\/m.media-amazon.com","c_p":"\\/images\\/I","p":["\\/51+xe2eux3L._SL500_.jpg","\\/51fEO8IctQL._SL500_.jpg","\\/61IR5SPrb4L._SL500_.jpg","\\/41ZW9l7B8eL._SL500_.jpg","\\/61GXEicsstL._SL500_.jpg","\\/41zA97p6k2L._SL500_.jpg","\\/51mDRqL3x1L._SL500_.jpg","\\/61rSbn+2kgL._SL500_.jpg","\\/41knpiswZBL._SL500_.jpg"],"u":{"u":"https:\\/\\/www.amazon.co.jp\\/dp\\/B0DQC4LNLQ","t":"amazon","r_v":""},"v":"2.1","b_l":[{"id":1,"u_tx":"Amazonで見る","u_bc":"#f79256","u_url":"https:\\/\\/www.amazon.co.jp\\/dp\\/B0DQC4LNLQ","a_id":4046523,"p_id":170,"pl_id":27060,"pc_id":185,"s_n":"amazon","u_so":1},{"id":2,"u_tx":"楽天市場で見る","u_bc":"#f76956","u_url":"https:\\/\\/search.rakuten.co.jp\\/search\\/mall\\/%E3%80%90%E6%97%A5%E6%9C%AC%E9%80%9A%E4%BF%A1SIM%E3%80%91%E9%9F%B3%E5%A3%B0%E5%AF%BE%E5%BF%9C%EF%BC%9A%E5%90%88%E7%90%86%E7%9A%84%EF%BC%88%E3%82%B7%E3%83%B3%E3%83%97%E3%83%AB290%E3%83%97%E3%83%A9%E3%83%B3%E3%80%81%E3%81%BF%E3%82%93%E3%81%AA%E3%81%AE%E3%83%97%E3%83%A9%E3%83%B3%E3%80%8150GB%E3%83%97%E3%83%A9%E3%83%B3%E3%80%81%E4%BB%96%EF%BC%89%E3%81%BE%E3%81%9F%E3%81%AF%E3%83%87%E3%83%BC%E3%82%BF%E9%80%9A%E4%BF%A1%E5%B0%82%E7%94%A8%EF%BC%9A%EF%BC%88%E3%83%8D%E3%83%83%E3%83%88%E3%81%A0%E3%81%91%E3%83%97%E3%83%A9%E3%83%B3%EF%BC%89%E3%81%8B%E3%82%89%E9%81%B8%E3%82%93%E3%81%A7%E3%81%8A%E7%94%B3%E8%BE%BC%E3%81%BF%E3%81%84%E3%81%9F%E3%81%A0%E3%81%91%E3%82%8B%E6%96%B0%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC%E3%83%91%E3%83%83%E3%82%AF%20NT-ST2-P%20%E3%83%89%E3%82%B3%E3%83%A2%E3%83%8D%E3%83%83%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF%204G%2F3G\\/","a_id":4046502,"p_id":54,"pl_id":27059,"pc_id":54,"s_n":"rakuten","u_so":2},{"id":3,"u_tx":"Yahoo!ショッピングで見る","u_bc":"#66a7ff","u_url":"https:\\/\\/shopping.yahoo.co.jp\\/search?first=1\\u0026p=%E3%80%90%E6%97%A5%E6%9C%AC%E9%80%9A%E4%BF%A1SIM%E3%80%91%E9%9F%B3%E5%A3%B0%E5%AF%BE%E5%BF%9C%EF%BC%9A%E5%90%88%E7%90%86%E7%9A%84%EF%BC%88%E3%82%B7%E3%83%B3%E3%83%97%E3%83%AB290%E3%83%97%E3%83%A9%E3%83%B3%E3%80%81%E3%81%BF%E3%82%93%E3%81%AA%E3%81%AE%E3%83%97%E3%83%A9%E3%83%B3%E3%80%8150GB%E3%83%97%E3%83%A9%E3%83%B3%E3%80%81%E4%BB%96%EF%BC%89%E3%81%BE%E3%81%9F%E3%81%AF%E3%83%87%E3%83%BC%E3%82%BF%E9%80%9A%E4%BF%A1%E5%B0%82%E7%94%A8%EF%BC%9A%EF%BC%88%E3%83%8D%E3%83%83%E3%83%88%E3%81%A0%E3%81%91%E3%83%97%E3%83%A9%E3%83%B3%EF%BC%89%E3%81%8B%E3%82%89%E9%81%B8%E3%82%93%E3%81%A7%E3%81%8A%E7%94%B3%E8%BE%BC%E3%81%BF%E3%81%84%E3%81%9F%E3%81%A0%E3%81%91%E3%82%8B%E6%96%B0%E3%82%B9%E3%82%BF%E3%83%BC%E3%82%BF%E3%83%BC%E3%83%91%E3%83%83%E3%82%AF%20NT-ST2-P%20%E3%83%89%E3%82%B3%E3%83%A2%E3%83%8D%E3%83%83%E3%83%88%E3%83%AF%E3%83%BC%E3%82%AF%204G%2F3G","a_id":4046520,"p_id":1225,"pl_id":27061,"pc_id":1925,"s_n":"yahoo","u_so":3}],"eid":"1b4yz","s":"s"});
</script>
<div id="msmaflink-1b4yz">リンク</div>
<!-- MoshimoAffiliateEasyLink END -->`;

    console.log(`Processing ${slug}...`);
    const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug });
    if (!post) {
        console.error(`Post not found: ${slug}`);
        return;
    }

    let body = post.body || [];
    const newBody = [];
    let count = 0;

    for (let i = 0; i < body.length; i++) {
        const block = body[i];
        newBody.push(block);

        if (block._type === 'block') {
            const textCombined = (block.children || []).map(c => c.text || '').join('');
            if (textCombined.includes('のスターターパックはAmazonなどで購入できます') ||
                textCombined.includes('Amazonや楽天などであらかじめスターターパックを購入') ||
                textCombined.includes('A: Amazonなどのオンラインストアで購入可能です')) {

                newBody.push({
                    _type: 'htmlEmbed',
                    _key: block._key + '_moshimo_' + count,
                    html: moshimoHtml
                });
                count++;
            }
        }
    }

    await client.patch(post._id)
        .set({ body: newBody })
        .commit();
    console.log(`Updated ${slug} (Inserted ${count} Moshimo cards)`);
}

async function main() {
    await updateKurashiArticles();
    await updateMnpArticle();
}

main().catch(console.error);
