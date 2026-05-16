const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

const oldOB = `        if (type === 'Ledger') {
            const l = await db.Ledger.findByPk(id);
            if (l) {
                ob = Number(l.openingBalance || 0);
                obType = l.nature;
            }
        }`;

const newOB = `        if (type === 'Ledger') {
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

if (content.includes(oldOB)) {
    content = content.replace(oldOB, newOB);
    fs.writeFileSync(filePath, content);
    console.log('Updated ledger opening balance logic');
} else {
    console.log('Could not find opening balance block');
}
