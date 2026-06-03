const fs = require('fs');
let content = fs.readFileSync('admin-script.js', 'utf8');

let lines = content.split('\n');
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('TOTAL PDCN VALUE: Rs.')) {
        lines[i] = "    doc.text(`TOTAL PDCN VALUE: Rs. ${parseFloat(grandTotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 190, finalY, { align: 'right' });";
    }
}
fs.writeFileSync('admin-script.js', lines.join('\n'));
console.log('Fixed syntax error via lines replacement');
