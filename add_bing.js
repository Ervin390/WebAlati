const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file.startsWith('.') || file === 'PDF' || file === 'images') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (stat.isFile() && fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('google-site-verification') && !content.includes('msvalidate.01')) {
                content = content.replace(
                    /(<meta name="google-site-verification"[^>]+>)/g,
                    '$1\n    <meta name="msvalidate.01" content="FB37FB138F070E421441560F38845CB2" />'
                );
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDir(__dirname);
