const fs = require('fs');

const content = fs.readFileSync('admin-script.js', 'utf8');
const lines = content.split('\n');

function extractFunction(startToken) {
    let startIndex = lines.findIndex(l => l.includes(startToken) && !l.trim().startsWith('//'));
    if (startIndex === -1) return '';
    let braceCount = 0;
    let extracted = [];
    let started = false;
    for (let i = startIndex; i < lines.length; i++) {
        let line = lines[i];
        extracted.push(line);
        for(let char of line) {
            if(char === '{') { started = true; braceCount++; }
            if(char === '}') { braceCount--; }
        }
        if(started && braceCount === 0) {
            break;
        }
    }
    return extracted.join('\n');
}

let numWords = extractFunction('function numberToWords(num)');
let genStandard = extractFunction('async function generateStandardPDF({');
let genSample = extractFunction('async function generateSampleMatchedPDF({');

if(!numWords || !genStandard || !genSample) {
    console.error("Could not find all functions", {
        numWords: !!numWords, genStandard: !!genStandard, genSample: !!genSample
    });
    process.exit(1);
}

genStandard = genStandard.replace(/companyProfile/g, 'getCompanyProfile()');
genSample = genSample.replace(/companyProfile/g, 'getCompanyProfile()');

let header = `
// shared-pdf.js - Shared PDF Generation Logic for Admin and Stockist
window.getCompanyProfile = function() {
    return window.companyProfile || window.companySettings || {};
};
`;

fs.writeFileSync('shared-pdf.js', header + '\n' + numWords + '\n\n' + genStandard + '\n\n' + genSample);
console.log('Successfully wrote shared-pdf.js');
