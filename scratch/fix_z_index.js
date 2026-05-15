const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

// Increase Report Modal Z-Index to stay on top
content = content.replace(/id="reportModal"[\s\S]*?z-index: 4000;/, (match) => {
    return match.replace('z-index: 4000;', 'z-index: 6000;');
});

fs.writeFileSync(path, content);
console.log('Increased Report Modal Z-Index to 6000');
