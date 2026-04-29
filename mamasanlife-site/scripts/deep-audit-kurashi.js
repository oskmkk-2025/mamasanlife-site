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

async function deepAuditLinks() {
    console.log('Performing deep audit of all Kurashi-related links...');
    const posts = await client.fetch(`*[_type == "post"]`);
    const report = [];

    posts.forEach(post => {
        const body = post.body || [];
        const findings = [];

        body.forEach((block, index) => {
            // Check HTML Embeds (should be buttons)
            if (block._type === 'htmlEmbed') {
                if (block.html?.includes('kurashi') || block.html?.includes('afi-b.com')) {
                    if (!block.html.includes('affiliate-btn')) {
                        findings.push(`[Block ${index}] HTML Embed missing button class: ${block.html.substring(0, 100)}...`);
                    }
                }
            }

            // Check Normal Blocks (should NOT have Kurashi links as text)
            if (block._type === 'block') {
                const text = (block.children || []).map(c => c.text || '').join('');
                const hasAfiB = block.markDefs?.some(m => m.href?.includes('afi-b.com') || m.href?.includes('visit.php'));

                if (hasAfiB) {
                    findings.push(`[Block ${index}] Text-based link found: "${text}"`);
                } else if (text.includes('くらしのマーケット') && !post.tags?.includes('くらしのマーケット')) {
                    // Mention in text but tag missing? (Optional check)
                }
            }
        });

        if (findings.length > 0) {
            report.push({
                slug: post.slug?.current,
                title: post.title,
                findings
            });
        }
    });

    if (report.length > 0) {
        console.log('Detailed Audit Report:');
        report.forEach(p => {
            console.log(`\nPost: ${p.title} (${p.slug})`);
            p.findings.forEach(f => console.log(`  - ${f}`));
        });
    } else {
        console.log('No issues found. All Kurashi links appear to be properly handled.');
    }
}

deepAuditLinks().catch(console.error);
