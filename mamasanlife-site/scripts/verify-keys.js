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
    apiVersion: '2024-03-14',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
});

async function verifyKeys() {
    try {
        console.log('Project ID:', process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
        const docs = await client.fetch('*');
        console.log(`Checking ${docs.length} documents...`);

        let failCount = 0;

        function findMissing(val, path = '') {
            if (Array.isArray(val)) {
                val.forEach((item, i) => {
                    const currentPath = `${path}[${i}]`;
                    if (typeof item === 'object' && item !== null) {
                        if (!item._key && !item._id) {
                            console.log(`MISSING KEY at ${currentPath}`);
                            failCount++;
                        }
                        for (const key in item) {
                            findMissing(item[key], `${currentPath}.${key}`);
                        }
                    }
                });
            } else if (typeof val === 'object' && val !== null) {
                for (const key in val) {
                    findMissing(val[key], `${path}.${key}`);
                }
            }
        }

        for (const doc of docs) {
            findMissing(doc, doc._id);
        }

        console.log(`Total missing keys found: ${failCount}`);
    } catch (err) {
        console.error('Failed to verify keys:', err);
    }
}

verifyKeys();
