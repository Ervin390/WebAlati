const fs = require('fs');
const path = require('path');

const baseDir = require('path').resolve('C:\\Users\\Računalo\\Desktop\\Afffilate web stranica');

const files = [
    { file: 'en/best-ai-video-tools.html', lang: 'en' },
    { file: 'en/best-ai-productivity-tools.html', lang: 'en' },
    { file: 'en/best-ai-marketing-tools.html', lang: 'en' },
    { file: 'en/best-ai-audio-tools.html', lang: 'en' },
    { file: 'en/best-ai-image-tools.html', lang: 'en' },
    { file: 'en/best-ai-coding-tools.html', lang: 'en' },
    { file: 'en/best-ai-education-tools.html', lang: 'en' },
    { file: 'en/earn-money-with-ai.html', lang: 'en' },
    { file: 'en/best-entertainment-tools.html', lang: 'en' },
    { file: 'hr/ai-video-alati.html', lang: 'hr' },
    { file: 'hr/ai-produktivnost-alati.html', lang: 'hr' },
    { file: 'hr/ai-marketing-alati.html', lang: 'hr' },
    { file: 'hr/ai-audio-alati.html', lang: 'hr' },
    { file: 'hr/ai-image-alati.html', lang: 'hr' },
    { file: 'hr/ai-coding-alati.html', lang: 'hr' },
    { file: 'hr/ai-edukacija-alati.html', lang: 'hr' },
    { file: 'hr/zarada-ai.html', lang: 'hr' },
    { file: 'hr/zabava-alati.html', lang: 'hr' }
];

for(const f of files) {
    const fullPath = path.join(baseDir, f.file);
    let html = fs.readFileSync(fullPath, 'utf8');
    
    // Add Schema
    if(!html.includes('application/ld+json')) {
        const regex = /<div class="fq"><h3>(.*?)<\/h3><p>(.*?)<\/p><\/div>/g;
        let match;
        const mainEntity = [];
        while ((match = regex.exec(html)) !== null) {
            mainEntity.push({
                "@type": "Question",
                "name": match[1],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": match[2].replace(/<\/?[^>]+(>|$)/g, "") // strip html
                }
            });
        }
        
        if(mainEntity.length > 0) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": mainEntity
            };
            const scriptTag = `\n  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>\n`;
            html = html.replace('</head>', scriptTag + '</head>');
        }
    }

    // Add Newsletter CTA right before FAQ
    if(!html.includes('cta-banner')) {
        const ctaEn = `
  <section class="cta-banner" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(79, 70, 229, 0.1)); border: 1px solid rgba(120, 80, 255, 0.2); border-radius: 16px; padding: 2rem; text-align: center; margin-bottom: 3rem;">
    <h2 style="margin-bottom: 1rem; font-size: 1.5rem;">Get Your Free PDF Guide!</h2>
    <p style="margin-bottom: 1.5rem; opacity: 0.8; max-width: 600px; margin-left: auto; margin-right: auto;">Subscribe to our newsletter to receive the best new AI tools every week and instantly download our exclusive Prompt Engineering Guide.</p>
    <a href="/en/" style="display: inline-block; padding: 0.8rem 1.5rem; border-radius: 8px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none; font-weight: 600;">Subscribe on Homepage &rarr;</a>
  </section>
`;
        const ctaHr = `
  <section class="cta-banner" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(79, 70, 229, 0.1)); border: 1px solid rgba(120, 80, 255, 0.2); border-radius: 16px; padding: 2rem; text-align: center; margin-bottom: 3rem;">
    <h2 style="margin-bottom: 1rem; font-size: 1.5rem;">Preuzmite Besplatni PDF Vodič!</h2>
    <p style="margin-bottom: 1.5rem; opacity: 0.8; max-width: 600px; margin-left: auto; margin-right: auto;">Pretplatite se na naš newsletter i svaki tjedan primajte najbolje nove AI alate te odmah preuzmite naš ekskluzivni Prompt Engineering Vodič.</p>
    <a href="/hr/" style="display: inline-block; padding: 0.8rem 1.5rem; border-radius: 8px; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none; font-weight: 600;">Pretplati se na Početnoj &rarr;</a>
  </section>
`;
        const ctaHtml = f.lang === 'en' ? ctaEn : ctaHr;
        html = html.replace('<section class="s-faq">', ctaHtml + '\n  <section class="s-faq">');
    }

    // Phase 3: Open Graph, Twitter Cards, and ItemList Schema

    // Extract title, description, url dynamically from the page
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';

    const descMatch = html.match(/<meta name="description" content="(.*?)">/);
    const description = descMatch ? descMatch[1] : '';

    const canonicalMatch = html.match(/<link rel="canonical" href="(.*?)">/);
    const url = canonicalMatch ? canonicalMatch[1] : '';

    // Add OG and Twitter tags if not present
    if (!html.includes('<meta property="og:type"')) {
        const ogTags = `
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${f.lang === 'en' ? 'en_US' : 'hr_HR'}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://webalati.tech/images/1000028266.jpg">
  <meta property="og:site_name" content="${f.lang === 'en' ? 'WebTools' : 'WebAlati'}">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://webalati.tech/images/1000028266.jpg">
`;
        html = html.replace('</head>', ogTags + '\n</head>');
    }

    // Add ItemList Schema
    if (!html.includes('"@type": "ItemList"')) {
        const toolRegex = /<p class="s-name">(.*?)<\/p>/g;
        let tMatch;
        const items = [];
        let index = 1;
        while ((tMatch = toolRegex.exec(html)) !== null) {
            items.push({
                "@type": "ListItem",
                "position": index,
                "item": {
                    "@type": "SoftwareApplication",
                    "name": tMatch[1]
                }
            });
            index++;
        }

        if (items.length > 0) {
            const listSchema = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "itemListElement": items
            };
            const scriptTagList = `\n  <script type="application/ld+json">\n${JSON.stringify(listSchema, null, 2)}\n  </script>\n`;
            html = html.replace('</head>', scriptTagList + '</head>');
        }
    }

    fs.writeFileSync(fullPath, html, 'utf8');
}
console.log('Update Complete');
