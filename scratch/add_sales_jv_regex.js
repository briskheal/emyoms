const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let serverJS = fs.readFileSync(path, 'utf8');

const regex = /if\s*\(stockist\)\s*\{\s*await\s*stockist\.increment\('outstandingBalance',\s*\{\s*by:\s*numGrandTotal\s*\}\);\s*\}/;

const match = serverJS.match(regex);
if (match) {
    const newBlock = `if (stockist) {
            await stockist.increment('outstandingBalance', { by: numGrandTotal });
            // Generate Auto JV for Sales
            try {
                await autoPostSalesJV(newInvoice, stockist);
            } catch(err) { console.error("Auto JV failed for sales:", err); }
        }`;
    serverJS = serverJS.replace(regex, newBlock);
    fs.writeFileSync(path, serverJS);
    console.log("SUCCESS: Replaced via regex.");
} else {
    console.log("REGEX failed.");
}
