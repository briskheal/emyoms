const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin-script.js');
let script = fs.readFileSync(filePath, 'utf8');

const newFuncs = `function updatePartyBalanceDisplay() {
    const partyId = document.getElementById('pay-party').value;
    const balanceEl = document.getElementById('party-total-due');
    const listEl = document.getElementById('bill-preview-list');

    if (!partyId) {
        if (balanceEl) {
            balanceEl.innerText = "Outstanding: ₹0.00";
            balanceEl.style.color = 'var(--text-muted)';
        }
        if (listEl) listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem; font-style: italic;">Select a party to see outstanding bills...</div>';
        return;
    }
    previewBillAdjustment();
}

function previewBillAdjustment() {
    const partyId = document.getElementById('pay-party').value;
    const amount = Number(document.getElementById('pay-amount').value) || 0;
    const type = document.getElementById('pay-type').value;
    const listEl = document.getElementById('bill-preview-list');
    const balanceEl = document.getElementById('party-total-due');

    if (!partyId) return;

    let remaining = amount;
    
    const bills = type === 'RECEIPT' 
        ? allInvoices.filter(i => (String(i.stockist?._id) === String(partyId) || String(i.stockistId) === String(partyId)) && (Number(i.outstandingAmount ?? i.grandTotal) > 0)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
        : allPurchaseEntries.filter(p => (String(p.supplierId) === String(partyId)) && (Number(p.outstandingAmount ?? p.grandTotal) > 0)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calculate total actual outstanding from active bills
    const totalActualOutstanding = bills.reduce((sum, b) => sum + Number(b.outstandingAmount ?? b.grandTotal), 0);
    
    if (balanceEl) {
        balanceEl.innerText = \`Outstanding: ₹\${totalActualOutstanding.toLocaleString('en-IN', {minimumFractionDigits:2})}\`;
        balanceEl.style.color = totalActualOutstanding > 0 ? '#f59e0b' : '#10b981';
    }

    if (bills.length === 0) {
        const emptyMsg = '<div style="text-align: center; color: var(--text-muted); padding: 2rem; font-style: italic; opacity: 0.6;">No outstanding bills found for this party.</div>';
        if (listEl) listEl.innerHTML = emptyMsg;
        
        const unallocatedEl = document.getElementById('unallocated-amount');
        if (unallocatedEl) unallocatedEl.innerText = \`₹0.00\`;
        
        const linkedBadge = document.getElementById('linked-total-badge');
        if (linkedBadge) linkedBadge.innerText = \`LINKED: ₹0.00\`;
        return;
    }

    // Render Logic for container
    let previewHtml = \`<table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead style="background:rgba(255,255,255,0.02); color:var(--primary);">
            <tr><th style="text-align:left; padding:8px;">Bill No</th><th style="text-align:right;">Due</th><th style="text-align:right; color:var(--accent);">Adjusting</th></tr>
        </thead>
        <tbody>\`;

    let totalLinked = 0;

    bills.forEach(b => {
        const due = Number(b.outstandingAmount ?? b.grandTotal);
        const adj = Math.min(remaining, due);
        totalLinked += adj;
        
        // Form Preview
        previewHtml += \`<tr style="border-bottom:1px solid rgba(255,255,255,0.03); opacity: \${adj > 0 ? 1 : 0.4};">
            <td style="padding:8px; font-family:monospace;">\${b.invoiceNo || b.purchaseNo}</td>
            <td style="text-align:right; padding:8px;">₹\${due.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td style="text-align:right; padding:8px; font-weight:800; color:var(--accent);">₹\${adj.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
        </tr>\`;

        remaining -= adj;
    });

    previewHtml += '</tbody></table>';
    if (listEl) listEl.innerHTML = previewHtml;

    // Update unallocated and linked badges
    const unallocatedEl = document.getElementById('unallocated-amount');
    if (unallocatedEl) {
        unallocatedEl.innerText = \`₹\${remaining.toLocaleString('en-IN', {minimumFractionDigits:2})}\`;
        unallocatedEl.style.color = remaining > 0 ? '#ef4444' : '#10b981';
    }
    
    const linkedBadge = document.getElementById('linked-total-badge');
    if (linkedBadge) {
        linkedBadge.innerText = \`LINKED: ₹\${totalLinked.toLocaleString('en-IN', {minimumFractionDigits:2})}\`;
    }
}`;

const replaceRegex = /function updatePartyBalanceDisplay\(\) \{[\s\S]*?function previewBillAdjustment\(\) \{[\s\S]*?if \(unallocatedEl\) \{[\s\S]*?unallocatedEl\.style\.color = remaining > 0 \? '#ef4444' : '#10b981';\n    \}\n\}/;

script = script.replace(replaceRegex, newFuncs);
fs.writeFileSync(filePath, script);
console.log('Successfully updated JS for dynamic outstanding calc.');
