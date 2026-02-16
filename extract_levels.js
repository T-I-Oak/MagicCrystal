const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'index_bundled.html');
const outputPath = path.join(__dirname, 'game', 'levels.js');

try {
    const content = fs.readFileSync(inputPath, 'utf8');
    const match = content.match(/const ALL_LEVELS = \[.*?\];/);

    if (match) {
        fs.writeFileSync(outputPath, match[0]); // Write the full line
        console.log('Successfully extracted ALL_LEVELS to ' + outputPath);
    } else {
        console.error('Could not find ALL_LEVELS in ' + inputPath);
    }
} catch (err) {
    console.error('Error:', err);
}
