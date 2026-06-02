const fs = require('fs');
let content = fs.readFileSync('admin-script.js', 'utf8');

const badBlock = `    if (partySelect) {
        partySelect.value = o.stockistId || (o.stockist ? o.stockist._id : '');
        document.getElementById('sale-party-search').value = o.stockist ? o.stockist.name : 'Unknown';
        if (lineTotalEl) lineTotalEl.innerText = \`₹\${lineTotal.toFixed(2)}\`;
        
        const gstPct = Number(item.gstPercent || 0);
        const itemGst = (lineTotal * gstPct) / 100;
        subTotal += lineTotal;
        gstAmount += itemGst;
    });`;

const goodBlock = `    if (partySelect) {
        partySelect.value = o.stockistId || (o.stockist ? o.stockist._id : '');
        document.getElementById('sale-party-search').value = o.stockist ? o.stockist.name : 'Unknown';
    }
    
    safeSetVal('sale-date', inv.createdAt ? inv.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    safeSetVal('sale-ref-no', o.refNo || o.orderNo || '');
    safeSetVal('sale-remarks', o.remarks || '');
    const supply = inv.placeOfSupply || (o.stockist ? (o.stockist.state || o.stockist.city) : '') || (companyProfile ? companyProfile.defaultPlaceOfSupply : '');
    safeSetVal('sale-supply', supply);
    
    renderSaleItems();
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
        if (lineTotalEl) lineTotalEl.innerText = \`₹\${lineTotal.toFixed(2)}\`;
        
        const gstPct = Number(item.gstPercent || 0);
        const itemGst = (lineTotal * gstPct) / 100;
        subTotal += lineTotal;
        gstAmount += itemGst;
    });`;

// Because of potential CRLF issues, we will normalize both to LF, replace, and then write.
content = content.replace(/\r\n/g, '\n');
const searchBlock = badBlock.replace(/\r\n/g, '\n');
const replacement = goodBlock.replace(/\r\n/g, '\n');

if (content.includes(searchBlock)) {
    content = content.replace(searchBlock, replacement);
    fs.writeFileSync('admin-script.js', content);
    console.log("Success");
} else {
    console.log("Failed to find badBlock");
}
