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

async function findBrokenLinks() {
    console.log('Searching for broken Kurashi links in all posts...');
    const posts = await client.fetch(`*[_type == "post"]`);
    const brokenPosts = [];

    posts.forEach(post => {
        const bodyText = JSON.stringify(post.body || []);
        // Check for common broken link patterns
        if (bodyText.includes('visit-php') || bodyText.includes('visit.php')) {
            // Broken if it's a relative path starting with /life/ or if it doesn't point to the correct affiliate domain
            if (bodyText.includes('/life/visit-php') || (bodyText.includes('visit.php') && !bodyText.includes('https://t.afi-b.com'))) {
                brokenPosts.push({
                    slug: post.slug?.current,
                    title: post.title
                });
            }
        }
    });

    if (brokenPosts.length > 0) {
        console.log('Found potentially broken Kurashi links in:');
        brokenPosts.forEach(p => console.log(`- ${p.title} (${p.slug})`));
    } else {
        console.log('No broken Kurashi links found in other posts.');
    }
}

findBrokenLinks().catch(console.error);
