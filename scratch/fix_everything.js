const fs = require('fs');
const path = require('path');

// --- FIX admin.html ---
const htmlPath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Fix JV table headers
const oldJvHeader = `                                    <th style="width: 100px;">JV NO</th>
                                    <th style="width: 100px;">DATE</th>
                                    <th>NARRATION</th>
                                    <th style="text-align: right; width: 150px;">TOTAL (&#8377;)</th>
                                </tr>
                            </thead>
                            <tbody id="jv-grid-body">
                                <tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading JVs...</td></tr>`;

const newJvHeader = `                                    <th style="width: 100px;">JV NO</th>
                                    <th style="width: 100px;">DATE</th>
                                    <th>NARRATION</th>
                                    <th style="text-align: right; width: 120px;">DR (&#8377;)</th>
                                    <th style="text-align: right; width: 120px;">CR (&#8377;)</th>
                                    <th style="width: 120px; text-align: center;">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody id="jv-grid-body">
                                <tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading JVs...</td></tr>`;

if (html.includes(oldJvHeader)) {
    html = html.replace(oldJvHeader, newJvHeader);
    console.log('Fixed admin.html JV headers');
} else {
    // try removing carriage returns
    const normalizedHtml = html.replace(/\r/g, '');
    const normalizedOld = oldJvHeader.replace(/\r/g, '');
    if (normalizedHtml.includes(normalizedOld)) {
        html = normalizedHtml.replace(normalizedOld, newJvHeader);
        console.log('Fixed admin.html JV headers (normalized)');
    } else {
        console.log('Could not find JV headers in admin.html');
    }
}
fs.writeFileSync(htmlPath, html);

// --- FIX admin-script.js ---
const jsPath = path.join(__dirname, '..', 'admin-script.js');
let script = fs.readFileSync(jsPath, 'utf8');
script = script.replace(/\r/g, ''); // Normalize to Unix line endings for matching

// Fix JV render target ID
const oldJvJs = `const tbody = document.getElementById('jvs-grid');`;
const newJvJs = `const tbody = document.getElementById('jv-grid-body');`;
if (script.includes(oldJvJs)) {
    script = script.replace(oldJvJs, newJvJs);
    console.log('Fixed JV grid ID in JS');
}

// Fix openPaymentModal memory clear
const oldOpenModal = `function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    if(!modal || !form) return;
    
    form.reset();
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('pay-type').value = currentPaymentTypeFilter;
    
    updatePaymentContext();
    modal.classList.remove('hidden');
}`;

const newOpenModal = `function openPaymentModal() {
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

if (script.includes(oldOpenModal)) {
    script = script.replace(oldOpenModal, newOpenModal);
    console.log('Fixed openPaymentModal logic');
}

// Fix updatePaymentContext doc fetch
const oldCtx = `    badge.innerText = type === 'RECEIPT' ? "RECEIPT" : "PAYMENT OUT";
    badge.style.background = type === 'RECEIPT' ? '#10b981' : '#ef4444';
    vPlaceholder.innerText = \`PAY\${type === 'RECEIPT' ? 'IN' : 'OUT'}-\${yearTag}-XXXX\`;`;

const newCtx = `    badge.innerText = type === 'RECEIPT' ? "RECEIPT" : "PAYMENT OUT";
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

if (script.includes(oldCtx)) {
    script = script.replace(oldCtx, newCtx);
    console.log('Fixed updatePaymentContext logic');
}

fs.writeFileSync(jsPath, script);
