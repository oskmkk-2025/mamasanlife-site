const sharp = require('sharp');
const path = require('path');

async function makeTransparent(inputPath, outputPath) {
    const image = sharp(inputPath);
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Chroma-key detection: high green, low red/blue
        // Using a more robust check for neon green #00FF00
        if (g > 150 && g > r * 1.5 && g > b * 1.5) {
            data[i + 3] = 0;
        }
    }

    await sharp(data, {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4
        }
    }).png().toFile(outputPath);
    console.log(`Converted ${inputPath} to ${outputPath}`);
}

const logoIn = '/Users/makiko/.gemini/antigravity/brain/55b4c392-05b9-4d17-80a2-5c93af89de8b/logo_v19_green_screen_png_1767916285452.png';
const logoOut = '/Users/makiko/GPT-codexProjects/mamasanlife-site/public/icons/site-logo.png';
const faviconIn = '/Users/makiko/.gemini/antigravity/brain/55b4c392-05b9-4d17-80a2-5c93af89de8b/favicon_v14_green_screen_png_1767916303879.png';
const faviconOut = '/Users/makiko/GPT-codexProjects/mamasanlife-site/public/icons/favicon.png';

async function main() {
    await makeTransparent(logoIn, logoOut);
    await makeTransparent(faviconIn, faviconOut);
}

main().catch(console.error);
