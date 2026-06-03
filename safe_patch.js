const fs = require('fs');
let code = fs.readFileSync('admin-script.js', 'utf8');

// 1. Fix approveOrder qtySelections
code = code.replace(
    /const batchSelections = \{\};\s*o\.items\.forEach\(item => \{\s*const select = document\.getElementById\(`batch-\$\{o\._id\}-\$\{item\._id\}`\);\s*if \(select\) \{\s*batchSelections\[item\._id\] = select\.value;\s*\}\s*\}\);/g,
    `const batchSelections = {};
    const qtySelections = {};
    o.items.forEach(item => {
        const select = document.getElementById(\`batch-\${o._id}-\${item._id}\`);
        if (select) {
            batchSelections[item._id] = select.value;
        }
        const qtyInp = document.getElementById(\`qty-\${o._id}-\${item._id}\`);
        if (qtyInp) qtySelections[item._id] = Number(qtyInp.value);
    });`
);

// 2. Add null checks to footer elements
code = code.replace(
    /document\.getElementById\('detail-subtotal'\)\.innerText = `₹\$\{subTotal\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}`;/g,
    `if (document.getElementById('detail-subtotal')) document.getElementById('detail-subtotal').innerText = \`₹\${subTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;`
);
code = code.replace(
    /document\.getElementById\('detail-gst'\)\.innerText = `₹\$\{gstAmount\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}`;/g,
    `if (document.getElementById('detail-gst')) document.getElementById('detail-gst').innerText = \`₹\${gstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;`
);
code = code.replace(
    /document\.getElementById\('detail-roundoff'\)\.innerText = `₹\$\{roundOff\}`;/g,
    `if (document.getElementById('detail-roundoff')) document.getElementById('detail-roundoff').innerText = \`₹\${roundOff}\`;`
);
code = code.replace(
    /document\.getElementById\('detail-total'\)\.innerText = `₹\$\{grandTotal\.toLocaleString\('en-IN', \{minimumFractionDigits: 2\}\)\}`;/g,
    `if (document.getElementById('detail-total')) document.getElementById('detail-total').innerText = \`₹\${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}\`;`
);

fs.writeFileSync('admin-script.js', code);
console.log('Fixed approveOrder and updateModalTotals safely.');
