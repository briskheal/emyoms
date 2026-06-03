const fs = require('fs');
let content = fs.readFileSync('admin-script.js', 'utf8');

content = content.replace(/doc\.text\(\`TOTAL PDCN VALUE: Rs\. \${parseFloat\(grandTotal\)\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)}\`, 190, finalY, \{ align: 'right' \}\);\}(\`, 190, finalY, \{ align: 'right' \};\)/g, "doc.text(`TOTAL PDCN VALUE: Rs. ${parseFloat(grandTotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 190, finalY, { align: 'right' });");

// Actually let's just do a string replace
const badString = "doc.text(`TOTAL PDCN VALUE: Rs. ${parseFloat(grandTotal).toLocaleString('en-IN', \\n{minimumFractionDigits: 2})}`, 190, finalY, { align: 'right' });}`, 190, finalY, { align: 'right' });";

const regex = /doc\.text\(\`TOTAL PDCN VALUE: Rs\. \$\{parseFloat\(grandTotal\)\.toLocaleString\('en-IN', \n?\{minimumFractionDigits: 2\}\)\}\`, 190, finalY, \{ align: 'right' \}\);\}(\`, 190, finalY, \{ align: 'right' \};\)/;

// Let's just fix the bad text by reading and using substring
let lines = content.split('\n');
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('TOTAL PDCN VALUE')) {
        lines[i] = "    doc.text(`TOTAL PDCN VALUE: Rs. ${parseFloat(grandTotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 190, finalY, { align: 'right' });";
    }
}
fs.writeFileSync('admin-script.js', lines.join('\n'));
console.log('Fixed syntax error');
