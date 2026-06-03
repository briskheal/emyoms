const fs = require('fs');
let content = fs.readFileSync('admin-script.js', 'utf8');

// 1. Restore updateModalTotals
let badStart = `    renderSaleItems();\n}\n\n        if (lineTotalEl) lineTotalEl.innerText = \`₹\${lineTotal.toFixed(2)}\`;`;
let correctUpdateModalTotals = `    renderSaleItems();
}

function updateModalTotals(orderId, triggerItemId) {
    const o = allOrders.find(x => x._id == orderId);
    if (!o) return;

    let subTotal = 0;
    let gstAmount = 0;

    o.items.forEach(item => {
        const rateInput = document.getElementById(\`rate-\${orderId}-\${item._id}\`);
        const rate = Number(rateInput ? (rateInput.value || 0) : (item.priceUsed || 0));
        const qtyInput = document.getElementById(\`qty-\${orderId}-\${item._id}\`);
        const qty = Number(qtyInput ? (qtyInput.value || 0) : (item.qty || 0));
        const lineTotal = rate * qty;
        
        const lineTotalEl = document.getElementById(\`linetotal-\${orderId}-\${item._id}\`);
        if (lineTotalEl) lineTotalEl.innerText = \`₹\${lineTotal.toFixed(2)}\`;`;

content = content.replace(badStart, correctUpdateModalTotals);

// 2. Fix the error in renderPDCNReviewItems
const badPDCN1 = `        const billed = parseFloat(item.billedPrice || 0);
        const special = parseFloat(item.specialPrice || 0);
        const qtyInput = document.getElementById(\`qty-\${orderId}-\${item._id}\`);
        const qty = Number(qtyInput ? (qtyInput.value || 0) : (item.qty || 0));`;

const goodPDCN1 = `        const billed = parseFloat(item.billedPrice || 0);
        const special = parseFloat(item.specialPrice || 0);
        const qty = parseInt(item.qty || 0);`;

content = content.replace(badPDCN1, goodPDCN1);

// 3. Fix the error in updateAdminPDCNItem
const badPDCN2 = `    const billed = parseFloat(item.billedPrice || 0);
    const special = parseFloat(item.specialPrice || 0);
    const qtyInput = document.getElementById(\`qty-\${orderId}-\${item._id}\`);
        const qty = Number(qtyInput ? (qtyInput.value || 0) : (item.qty || 0));`;

const goodPDCN2 = `    const billed = parseFloat(item.billedPrice || 0);
    const special = parseFloat(item.specialPrice || 0);
    const qty = parseInt(item.qty || 0);`;

content = content.replace(badPDCN2, goodPDCN2);

fs.writeFileSync('admin-script.js', content);
console.log('Restored updateModalTotals and fixed PDCN variables');
