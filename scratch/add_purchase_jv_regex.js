const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let serverJS = fs.readFileSync(path, 'utf8');

const regex = /if\s*\(supplierId\)\s*\{\s*const\s*stockist\s*=\s*await\s*db\.Stockist\.findByPk\(supplierId\);\s*if\s*\(stockist\)\s*await\s*stockist\.decrement\('outstandingBalance',\s*\{\s*by:\s*grandTotal\s*\}\);\s*\}/;

const match = serverJS.match(regex);
if (match) {
    const newBlock = `if (supplierId) {
            const stockist = await db.Stockist.findByPk(supplierId);
            if (stockist) {
                await stockist.decrement('outstandingBalance', { by: grandTotal });
                try { await autoPostPurchaseJV(entry, stockist); } catch(err) { console.error("Auto JV failed for purchase:", err); }
            }
        }`;
    serverJS = serverJS.replace(regex, newBlock);
    fs.writeFileSync(path, serverJS);
    console.log("SUCCESS: Replaced via regex.");
} else {
    console.log("REGEX failed.");
}
