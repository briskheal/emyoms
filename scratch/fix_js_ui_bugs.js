const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin-script.js');
let script = fs.readFileSync(filePath, 'utf8');

const target1 = `function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    if(!modal || !form) return;
    
    form.reset();
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('pay-type').value = currentPaymentTypeFilter;
    
    updatePaymentContext();
    modal.classList.remove('hidden');
}`;

const replace1 = `function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    if(!modal || !form) return;
    
    form.reset();
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('pay-type').value = currentPaymentTypeFilter;
    
    // Reset badges and amounts for memory-free UI
    const unallocatedEl = document.getElementById('unallocated-amount');
    if (unallocatedEl) unallocatedEl.innerText = '₹0.00';
    const linkedBadge = document.getElementById('linked-total-badge');
    if (linkedBadge) linkedBadge.innerText = 'LINKED: ₹0.00';
    const balanceEl = document.getElementById('party-total-due');
    if (balanceEl) balanceEl.innerText = 'Outstanding: ₹0.00';
    const listEl = document.getElementById('bill-preview-list');
    if (listEl) listEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1rem; font-style: italic;">Select a party to see outstanding bills...</div>';
    const submitBtn = document.getElementById('pay-submit-btn');
    if (submitBtn) submitBtn.innerHTML = "✓ CONFIRM & POST";

    updatePaymentContext();
    modal.classList.remove('hidden');
}`;

if (script.includes(target1)) {
    script = script.replace(target1, replace1);
    console.log('Replaced target 1');
} else {
    console.log('Could not find target 1');
}

const target2 = `    badge.innerText = type === 'RECEIPT' ? "RECEIPT" : "PAYMENT OUT";
    badge.style.background = type === 'RECEIPT' ? '#10b981' : '#ef4444';
    vPlaceholder.innerText = \`PAY\${type === 'RECEIPT' ? 'IN' : 'OUT'}-\${yearTag}-XXXX\`;`;

const replace2 = `    badge.innerText = type === 'RECEIPT' ? "RECEIPT" : "PAYMENT OUT";
    badge.style.background = type === 'RECEIPT' ? '#10b981' : '#ef4444';
    
    vPlaceholder.innerText = 'Loading...';
    const docType = type === 'RECEIPT' ? 'payin' : 'payout';
    fetch(\`/api/admin/next-doc-no?type=\${docType}\`)
        .then(res => res.json())
        .then(data => {
            if (data && data.docNo) vPlaceholder.innerText = data.docNo;
            else vPlaceholder.innerText = \`PAY\${type === 'RECEIPT' ? 'IN' : 'OUT'}-\${yearTag}-XXXX\`;
        })
        .catch(e => {
            console.error('Failed to fetch next doc no:', e);
            vPlaceholder.innerText = \`PAY\${type === 'RECEIPT' ? 'IN' : 'OUT'}-\${yearTag}-XXXX\`;
        });`;

if (script.includes(target2)) {
    script = script.replace(target2, replace2);
    console.log('Replaced target 2');
} else {
    console.log('Could not find target 2');
}

fs.writeFileSync(filePath, script);
