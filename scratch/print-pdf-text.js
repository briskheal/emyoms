const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pdf-text.txt');
const content = fs.readFileSync(filePath, 'utf16le'); // or let's read the pdf directly and log it line by line
console.log(content.split('\n').map((line, idx) => `${idx + 1}: ${line.trim()}`).join('\n'));
process.exit(0);
