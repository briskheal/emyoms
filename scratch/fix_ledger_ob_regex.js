const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /if\s*\(\s*type\s*===\s*'Ledger'\s*\)\s*\{[\s\S]*?findByPk\(id\)[\s\S]*?openingBalance[\s\S]*?nature[\s\S]*?\}[\s\S]*?\}/;

const replacement = `if (type === 'Ledger') {
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

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Updated ledger opening balance logic with regex');
} else {
    console.log('Could not find opening balance block with regex');
}
