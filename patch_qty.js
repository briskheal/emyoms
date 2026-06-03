const fs = require('fs');

// --- Patch admin-script.js ---
let adminCode = fs.readFileSync('admin-script.js', 'utf8');

// Replace qty cell with input
adminCode = adminCode.replace(
    /<td style="text-align:center; font-weight:800; color: #fff;">\$\{item\.qty \|\| 0\}<\/td>/g,
    `<td style="text-align:center; font-weight:800; color: #fff;">
                    \${o.status === 'pending' ? \`
                    <input type="number" class="final-qty-input" id="qty-\${o._id}-\${item._id}" 
                        value="\${item.qty || 0}" 
                        oninput="updateModalTotals('\${o._id}', '\${item._id}')"
                        style="width: 60px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 6px; color: #fff; font-weight: 800; text-align: center; padding: 3px; font-size: 0.75rem;">
                    \` : \`\${item.qty || 0}\`}
                </td>`
);

// Update Modal Totals logic to pull from input
adminCode = adminCode.replace(
    /const qty = Number\(item\.qty \|\| 0\);/g,
    `const qtyInput = document.getElementById(\`qty-\${orderId}-\${item._id}\`);
        const qty = Number(qtyInput ? (qtyInput.value || 0) : (item.qty || 0));`
);

// Update approveOrder to capture qty
adminCode = adminCode.replace(
    /const batchSelections = \{\};\n\s*o\.items\.forEach\(item => \{/g,
    `const batchSelections = {};
    const qtySelections = {};
    o.items.forEach(item => {
        const qtyInp = document.getElementById(\`qty-\${o._id}-\${item._id}\`);
        if (qtyInp) qtySelections[item._id] = Number(qtyInp.value);`
);

// Update approveOrder POST body
adminCode = adminCode.replace(
    /body: JSON\.stringify\(\{ approvedBy: 'ADMIN', batchSelections, selectedHq \}\)/g,
    `body: JSON.stringify({ approvedBy: 'ADMIN', batchSelections, qtySelections, selectedHq })`
);

fs.writeFileSync('admin-script.js', adminCode);

// --- Patch server.js ---
let serverCode = fs.readFileSync('server.js', 'utf8');

// Extract approve endpoint body
serverCode = serverCode.replace(
    /const \{ approvedBy, selectedHq, batchSelections \} = req\.body;/g,
    `const { approvedBy, selectedHq, batchSelections, qtySelections } = req.body;`
);

// Add quantity update inside the for loop of items
// Find: for (const item of order.items) {
//          let totalDeduction = (item.qty || 0) + (item.bonusQty || 0);

serverCode = serverCode.replace(
    /for \(const item of order\.items\) \{\n\s*let totalDeduction = \(item\.qty \|\| 0\) \+ \(item\.bonusQty \|\| 0\);/g,
    `let newSubTotal = 0;
        let newGstAmount = 0;
        
        for (const item of order.items) {
            let itemQty = item.qty || 0;
            if (qtySelections && qtySelections[item.id] !== undefined) {
                itemQty = Number(qtySelections[item.id]);
                const newTotalValue = itemQty * (item.priceUsed || 0);
                await item.update({ qty: itemQty, totalValue: newTotalValue });
                item.qty = itemQty;
                item.totalValue = newTotalValue;
            }
            
            newSubTotal += (item.totalValue || 0);
            newGstAmount += ((item.totalValue || 0) * (item.gstPercent || 0)) / 100;

            let totalDeduction = (item.qty || 0) + (item.bonusQty || 0);`
);

// Update the order update line
serverCode = serverCode.replace(
    /await order\.update\(\{ status: 'approved', hq: selectedHq \|\| order\.hq \}\);/g,
    `const newGrandTotal = Math.round(newSubTotal + newGstAmount);
        await order.update({ 
            status: 'approved', 
            hq: selectedHq || order.hq,
            subTotal: newSubTotal,
            gstAmount: newGstAmount,
            grandTotal: newGrandTotal
        });`
);

fs.writeFileSync('server.js', serverCode);
console.log("Patched qty edits successfully.");
