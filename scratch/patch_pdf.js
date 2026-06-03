const fs = require('fs');
let content = fs.readFileSync('admin-script.js', 'utf8');

// Replace columnStyles
content = content.replace(/columnStyles:\s*\{[\s\S]*?5:\s*\{\s*halign:\s*'right',\s*fontStyle:\s*'bold'\s*\}\s*\}/, `columnStyles: {
            0: { cellWidth: 50 },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right', fontStyle: 'bold' }
        }`);

// Replace doc.text(TOTAL PDCN VALUE)
content = content.replace(/const finalY = doc\.lastAutoTable\.finalY \+ 15;[\s\S]*?doc\.text\(\`TOTAL PDCN VALUE[\s\S]*?\}\)/, `const finalY = doc.lastAutoTable.finalY + 15;
    const grandTotal = (currentPDCNReviewItems || []).reduce((sum, item) => sum + (item.finalPDCN || 0), 0);
    doc.setFontSize(12);
    doc.text(\`TOTAL PDCN VALUE: Rs. \${parseFloat(grandTotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}\`, 190, finalY, { align: 'right' });`);

fs.writeFileSync('admin-script.js', content);
console.log('Patched');
