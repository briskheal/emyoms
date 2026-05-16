const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// The problematic block that was accidentally injected into getNetBal (which is NOT async)
const badBlock = `        const getNetBal = (type, id, nature) => {
            let dr = 0, cr = 0;
            if (type === 'Ledger') {
            const l = await db.Ledger.findByPk(id);
            if (l) {
                ob = Number(l.openingBalance || 0);
                obType = l.nature;
            }
        } else if (type === 'Stockist') {
            const s = await db.Stockist.findByPk(id);
            if (s) {
                ob = Number(s.openingBalance || 0);
                obType = s.partyType === 'SUPPLIER' ? 'CR' : 'DR';
            }
        }`;

// The correct version of getNetBal (using pre-fetched data)
const fixedBlock = `        const getNetBal = (type, id, nature) => {
            let dr = 0, cr = 0;
            // Use pre-fetched opening balances if available
            if (type === 'Ledger') {
                const l = ledgers.find(x => x.id == id);
                if (l) {
                    const ob = Number(l.openingBalance || 0);
                    if (l.nature === 'DR') dr += ob; else cr += ob;
                }
            } else if (type === 'Stockist') {
                const s = stockists.find(x => x.id == id);
                if (s) {
                    const ob = Number(s.openingBalance || 0);
                    if (s.partyType === 'SUPPLIER') cr += ob; else dr += ob;
                }
            }

            const relevantLines = allLines.filter(l => l.entityType === type && l.entityId == id && dateFilter(l));
            relevantLines.forEach(l => {
                if (l.type === 'DR') dr += Number(l.amount);
                else cr += Number(l.amount);
            });
            return nature === 'DR' ? (dr - cr) : (cr - dr);
        };`;

if (content.includes(badBlock)) {
    content = content.replace(badBlock, fixedBlock);
    fs.writeFileSync(filePath, content);
    console.log('Fixed server.js: Removed invalid await and restored getNetBal logic');
} else {
    console.log('Could not find exact bad block, trying fallback repair...');
    // Fallback: Just fix the function signature to be async if it has awaits, 
    // but getNetBal is called in a loop, so it's better to fix the logic.
    // Let's check for the incorrect block again with less strict whitespace
}
