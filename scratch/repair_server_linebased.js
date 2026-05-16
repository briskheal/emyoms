const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the line numbers for the repair
let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const getNetBal = (type, id, nature) => {')) {
        startLine = i;
    }
    if (startLine !== -1 && lines[i].includes('app.get(\'/api/admin/journal-vouchers\'')) {
        endLine = i - 2; // Move up to stay within the previous endpoint
        break;
    }
}

if (startLine !== -1 && endLine !== -1) {
    console.log(`Repairing from line ${startLine + 1} to ${endLine + 1}`);
    
    const repair = `        const getNetBal = (type, id, nature) => {
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

        res.json({ success: true, assets, liabilities, income, expenses });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
`;

    const before = lines.slice(0, startLine).join('\n');
    const after = lines.slice(endLine + 1).join('\n');
    
    fs.writeFileSync(filePath, before + '\n' + repair + '\n' + after);
    console.log('Successfully repaired server.js using line-based splicing');
} else {
    console.log('Could not find markers');
}
