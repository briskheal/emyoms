const fs = require('fs');

let code = fs.readFileSync('script.js', 'utf8');

// Patch 1: selectReturnProduct to take productId
code = code.replace(
    /function selectReturnProduct\(idx, name, batch, exp, rate, gst, availableQty\) \{/g,
    'function selectReturnProduct(idx, name, batch, exp, rate, gst, availableQty, productId) {\n    purchaseReturnItems[idx].productId = productId;'
);

// Patch 2: handleReturnProductInput matches to search internalCode and pass productId
code = code.replace(
    /matches = stockistPurchaseHistory\.filter\(p => p\.name\.toLowerCase\(\)\.includes\(val\)\);/g,
    'matches = stockistPurchaseHistory.filter(p => p.name.toLowerCase().includes(val) || (p.internalCode && p.internalCode.toLowerCase().includes(val)));'
);
code = code.replace(
    /matches = allProducts\.filter\(p => p\.name\.toLowerCase\(\)\.includes\(val\)\)\.slice\(0, 15\);/g,
    'matches = allProducts.filter(p => p.name.toLowerCase().includes(val) || (p.internalCode && p.internalCode.toLowerCase().includes(val))).slice(0, 15);'
);

// Update stockistPurchaseHistory mapping to pass productId
code = code.replace(
    /onclick="selectReturnProduct\(\$\{idx\}, '\$\{\(m\.name \|\| ''\)\.replace\(\/'\/g, "\\\\'"\)\}', '\$\{m\.batch \|\| ''\}', '\$\{m\.expDate \|\| ''\}', \$\{m\.rate \|\| 0\}, \$\{m\.gst \|\| 12\}, \$\{m\.availableQty \|\| 0\}\)"/g,
    'onclick="selectReturnProduct(${idx}, \'${(m.name || \'\').replace(/\'/g, \\"\\\\\'\\")}\', \'${m.batch || \'\'}\', \'${m.expDate || \'\'}\', ${m.rate || 0}, ${m.gst || 12}, ${m.availableQty || 0}, ${m.productId || null})"'
);

// Update allProducts mapping to pass productId
code = code.replace(
    /onclick="selectReturnProduct\(\$\{idx\}, '\$\{\(m\.name \|\| ''\)\.replace\(\/'\/g, "\\\\'"\)\}', '', '', \$\{m\.pts \|\| m\.ptr \|\| 0\}, \$\{m\.gstPercent \|\| 12\}, 0\)"/g,
    'onclick="selectReturnProduct(${idx}, \'${(m.name || \'\').replace(/\'/g, \\"\\\\\'\\")}\', \'\', \'\', ${m.pts || m.ptr || 0}, ${m.gstPercent || 12}, 0, ${m._id || m.id})"'
);

// Update allProducts mapping to SHOW internalCode
code = code.replace(
    /<div style="font-weight:700; color:#fff;">\$\{m\.name\}<\/div>/g,
    '<div style="font-weight:700; color:#fff;">${m.internalCode ? `<span style="color:#a78bfa; font-size:0.65rem; margin-right:5px;">[${m.internalCode}]</span>` : \'\'}${m.name}</div>'
);

// Patch 3: handleReturnBatchInput to match by productId if available
code = code.replace(
    /const searchName = item\.name\.toLowerCase\(\)\.trim\(\);\s*matches = stockistPurchaseHistory\.filter\(p => p\.name\.toLowerCase\(\)\.includes\(searchName\)\);/g,
    `const searchName = item.name.toLowerCase().trim();
        if (item.productId) {
            matches = stockistPurchaseHistory.filter(p => String(p.productId) === String(item.productId));
        } else {
            matches = stockistPurchaseHistory.filter(p => p.name.toLowerCase().includes(searchName));
        }`
);

// Patch 4: renderExcelProducts to display internalCode
code = code.replace(
    /<div class="\$\{isWarning \? 'price-warning' : ''\}" style="font-weight: 800; color: \$\{isWarning \? '#f59e0b' : 'var\(--primary\)'\};">\$\{p\.name\}<\/div>/g,
    `<div class="\$\{isWarning ? 'price-warning' : ''\}" style="font-weight: 800; color: \$\{isWarning ? '#f59e0b' : 'var(--primary)'\};">\$\{p.internalCode ? \`<span style="color:#a78bfa; font-size:0.65rem; margin-right:5px;">[\$\{p.internalCode\}]</span>\` : ''\}\$\{p.name\}</div>`
);

fs.writeFileSync('script.js', code);
console.log("Patched script.js successfully");
