const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// The corrupted block (using line snippets from view_file)
const corruptedSection = `        const getNetBal = (type, id, nature) => {
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
        }

        res.json({ success: true, openingBalance: ob, obType, lines });`;

const repairedSection = `        const getNetBal = (type, id, nature) => {
            let dr = 0, cr = 0;
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
            const relevantLines = (lines || []).filter(line => line.entityType === type && line.entityId == id && dateFilter(line));
            relevantLines.forEach(line => {
                if (line.type === 'DR') dr += Number(line.amount);
                else cr += Number(line.amount);
            });
            return nature === 'DR' ? (dr - cr) : (cr - dr);
        };

        const assets = [], liabilities = [], income = [], expenses = [];
        ledgers.forEach(l => {
            const bal = getNetBal('Ledger', l.id, l.nature);
            if (bal === 0) return;
            const item = { name: l.name, amount: Math.abs(bal) };
            if (l.nature === 'DR') assets.push(item); else liabilities.push(item);
        });

        stockists.forEach(s => {
            const bal = getNetBal('Stockist', s.id, 'DR');
            if (bal === 0) return;
            if (bal > 0) assets.push({ name: \`Debtor: \${s.name}\`, amount: Math.abs(bal) });
            else liabilities.push({ name: \`Creditor: \${s.name}\`, amount: Math.abs(bal) });
        });

        res.json({ success: true, assets, liabilities, income, expenses });`;

if (content.includes(corruptedSection)) {
    content = content.replace(corruptedSection, repairedSection);
    fs.writeFileSync(filePath, content);
    console.log('Successfully repaired server.js logic and syntax');
} else {
    console.log('Could not find corrupted section exactly');
}
