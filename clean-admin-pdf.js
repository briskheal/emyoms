const fs = require('fs');
let content = fs.readFileSync('admin-script.js', 'utf8');
const lines = content.split('\n');

function getFunctionBounds(startToken) {
    let startIndex = lines.findIndex(l => l.includes(startToken) && !l.trim().startsWith('//'));
    if (startIndex === -1) return null;
    let braceCount = 0;
    let started = false;
    for (let i = startIndex; i < lines.length; i++) {
        let line = lines[i];
        for(let char of line) {
            if(char === '{') { started = true; braceCount++; }
            if(char === '}') { braceCount--; }
        }
        if(started && braceCount === 0) {
            return { start: startIndex, end: i };
        }
    }
    return null;
}

const bounds1 = getFunctionBounds('function numberToWords(num)');
const bounds2 = getFunctionBounds('async function generateStandardPDF({');
const bounds3 = getFunctionBounds('async function generateSampleMatchedPDF({');

let toRemove = new Set();
if(bounds1) for(let i=bounds1.start; i<=bounds1.end; i++) toRemove.add(i);
if(bounds2) for(let i=bounds2.start; i<=bounds2.end; i++) toRemove.add(i);
if(bounds3) for(let i=bounds3.start; i<=bounds3.end; i++) toRemove.add(i);

const newLines = lines.filter((_, i) => !toRemove.has(i));
fs.writeFileSync('admin-script.js', newLines.join('\n'));
console.log("admin-script.js cleaned successfully.");
