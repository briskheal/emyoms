const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Goal: Remove lines 2407 to 2447 (redundant JV functions)
// and ensure we use the better versions starting at 2357

let start = 2407 - 1; // 0-indexed
let end = 2447 - 1;

if (lines[start].includes('async function autoPostInvoiceJV')) {
    console.log(`Removing redundant JV functions from line ${start + 1} to ${end + 1}`);
    lines.splice(start, (end - start) + 1);
    
    // Also, let's fix the autoPostSalesJV vs autoPostInvoiceJV inconsistency
    // I will rename autoPostSalesJV to autoPostInvoiceJV to match the call in the endpoint
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('async function autoPostSalesJV')) {
            lines[i] = lines[i].replace('autoPostSalesJV', 'autoPostInvoiceJV');
            console.log(`Renamed autoPostSalesJV to autoPostInvoiceJV at line ${i + 1}`);
        }
    }

    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('Cleanup complete.');
} else {
    console.log('Markers not found at expected lines. Checking content...');
    // Fallback: search for the functions
}
