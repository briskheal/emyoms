const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Update updatePartyBalanceDisplay to also update the sidebar
const newUpdatePartyBalance = `function updatePartyBalanceDisplay() {
    const partyId = document.getElementById('pay-party').value;
    const balanceEl = document.getElementById('party-total-due');
    const listEl = document.getElementById('bill-preview-list');
    const sidebarList = document.getElementById('pending-bills-list');

    if (!partyId) {
        if (balanceEl) balanceEl.innerText = "Outstanding: ₹0.00";
        if (listEl) listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem; font-style: italic;">Select a party to see outstanding bills...</div>';
        if (sidebarList) sidebarList.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted); font-size: 0.8rem; border: 2px dashed var(--glass-border); border-radius: 20px;"><div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;">📋</div>Select a party to view pending invoices.</div>';
        return;
    }

    const s = allStockists.find(x => String(x._id) === String(partyId) || String(x.id) === String(partyId));
    if (s) {
        const bal = Number(s.outstandingBalance || 0);
        if (balanceEl) {
            balanceEl.innerText = \`Outstanding: ₹\${bal.toLocaleString('en-IN', {minimumFractionDigits:2})}\`;
            balanceEl.style.color = bal > 0 ? '#f59e0b' : '#10b981';
        }
    }
    previewBillAdjustment();
}`;

content = content.replace(/function updatePartyBalanceDisplay\(\) \{[\s\S]*?\n\}/, newUpdatePartyBalance);

// 2. Update previewBillAdjustment to show ALL bills even if amount is 0
const newPreviewBillAdjustment = `function previewBillAdjustment() {
    const partyId = document.getElementById('pay-party').value;
    const amount = Number(document.getElementById('pay-amount').value) || 0;
    const type = document.getElementById('pay-type').value;
    const listEl = document.getElementById('bill-preview-list');
    const sidebarList = document.getElementById('pending-bills-list');

    if (!partyId) return;

    let remaining = amount;
    
    const bills = type === 'RECEIPT' 
        ? allInvoices.filter(i => (String(i.stockist?._id) === String(partyId) || String(i.stockistId) === String(partyId)) && (Number(i.outstandingAmount ?? i.grandTotal) > 0)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
        : allPurchaseEntries.filter(p => (String(p.supplierId) === String(partyId)) && (Number(p.outstandingAmount ?? p.grandTotal) > 0)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (bills.length === 0) {
        const emptyMsg = '<div style="text-align: center; color: var(--text-muted); padding: 2rem; font-style: italic; opacity: 0.6;">No outstanding bills found for this party.</div>';
        if (listEl) listEl.innerHTML = emptyMsg;
        if (sidebarList) sidebarList.innerHTML = emptyMsg;
        return;
    }

    // Render Logic for both containers
    let previewHtml = \`<table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead style="background:rgba(255,255,255,0.02); color:var(--primary);">
            <tr><th style="text-align:left; padding:8px;">Bill No</th><th style="text-align:right;">Due</th><th style="text-align:right; color:var(--accent);">Adjusting</th></tr>
        </thead>
        <tbody>\`;

    let sidebarHtml = '';

    bills.forEach(b => {
        const due = Number(b.outstandingAmount ?? b.grandTotal);
        const adj = Math.min(remaining, due);
        
        // Form Preview
        previewHtml += \`<tr style="border-bottom:1px solid rgba(255,255,255,0.03); opacity: \${adj > 0 ? 1 : 0.4};">
            <td style="padding:8px; font-family:monospace;">\${b.invoiceNo || b.purchaseNo}</td>
            <td style="text-align:right; padding:8px;">₹\${due.toLocaleString('en-IN')}</td>
            <td style="text-align:right; padding:8px; font-weight:800; color:var(--accent);">₹\${adj.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
        </tr>\`;

        // Sidebar Detail Cards
        sidebarHtml += \`
            <div style="background: rgba(255,255,255,0.03); border: 1px solid \${adj > 0 ? 'rgba(16,185,129,0.3)' : 'var(--glass-border)'}; padding: 12px; border-radius: 12px; position: relative; transition: 0.3s;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 6px;">
                    <span style="font-family:monospace; font-weight:900; color:#fff; font-size:0.8rem;">\${b.invoiceNo || b.purchaseNo}</span>
                    <span style="font-size:0.6rem; color:var(--text-muted);">\${new Date(b.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size: 0.85rem; font-weight: 800; color: #10b981;">₹\${due.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
                    \${adj > 0 ? \`<div style="font-size:0.65rem; background:#10b981; color:#fff; padding:2px 6px; border-radius:4px; font-weight:900;">MATCHED: ₹\${adj.toLocaleString('en-IN')}</div>\` : ''}
                </div>
            </div>\`;

        remaining -= adj;
    });

    previewHtml += '</tbody></table>';
    if (listEl) listEl.innerHTML = previewHtml;
    if (sidebarList) sidebarList.innerHTML = sidebarHtml;

    // Update unallocated
    const unallocatedEl = document.getElementById('unallocated-amount');
    if (unallocatedEl) {
        unallocatedEl.innerText = \`₹\${remaining.toLocaleString('en-IN', {minimumFractionDigits:2})}\`;
        unallocatedEl.style.color = remaining > 0 ? '#ef4444' : '#10b981';
    }
}`;

content = content.replace(/function previewBillAdjustment\(\) \{[\s\S]*?\n\}/, newPreviewBillAdjustment);

fs.writeFileSync(path, content);
console.log('Fixed Payment Logic and Sidebar rendering');
