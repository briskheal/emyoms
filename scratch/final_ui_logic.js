const fs = require('fs');

// 1. Update admin.html for live updates
const htmlPath = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace('oninput="previewBillAdjustment()"', 'oninput="previewBillAdjustment(); updateLinkedTotal()"');
fs.writeFileSync(htmlPath, html);

// 2. Update admin-script.js
const scriptPath = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let script = fs.readFileSync(scriptPath, 'utf8');

// Update updatePartyBalanceDisplay to fetch bills
script = script.replace('function updatePartyBalanceDisplay() {', 'function updatePartyBalanceDisplay() {\n    fetchPendingBills();');

// Update savePayment to collect linked bills
const oldSavePaymentBody = `    const data = {
        type: type,
        date: document.getElementById('pay-date').value,
        party: document.getElementById('pay-party').value,
        amount: Number(document.getElementById('pay-amount').value),
        method: document.getElementById('pay-method').value,
        refNo: document.getElementById('pay-ref').value
    };`;

const newSavePaymentBody = `    const linkedBills = [];
    document.querySelectorAll('.bill-link-amt').forEach(input => {
        const amt = Number(input.value) || 0;
        if (amt > 0) {
            const bill = currentPendingBills[input.dataset.index];
            linkedBills.push({
                invoiceId: bill.invoiceNo ? bill.id : null,
                purchaseEntryId: bill.purchaseNo ? bill.id : null,
                amount: amt
            });
        }
    });

    const data = {
        type: type,
        date: document.getElementById('pay-date').value,
        party: document.getElementById('pay-party').value,
        amount: Number(document.getElementById('pay-amount').value),
        method: document.getElementById('pay-method').value,
        refNo: document.getElementById('pay-ref').value,
        linkedBills: linkedBills
    };`;

script = script.replace(oldSavePaymentBody, newSavePaymentBody);

// Append helper functions
const helpers = `
let currentPendingBills = [];

async function fetchPendingBills() {
    const partyId = document.getElementById('pay-party').value;
    const listEl = document.getElementById('pending-bills-list');
    if (!partyId) {
        listEl.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted); font-size: 0.8rem; border: 2px dashed var(--glass-border); border-radius: 20px;">Select a party to view pending bills.</div>';
        currentPendingBills = [];
        return;
    }

    listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.8rem;">Loading pending bills...</div>';

    try {
        const res = await fetch(\`/api/admin/stockists/\${partyId}/pending-bills\`);
        const data = await res.json();
        if (data.success) {
            currentPendingBills = [...(data.invoices || []), ...(data.purchases || [])];
            renderPendingBills();
        }
    } catch (e) {
        listEl.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444; font-size: 0.8rem;">Failed to load bills.</div>';
    }
}

function renderPendingBills() {
    const listEl = document.getElementById('pending-bills-list');
    if (currentPendingBills.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted); font-size: 0.8rem; border: 2px dashed var(--glass-border); border-radius: 20px;">No pending bills found for this party.</div>';
        return;
    }

    listEl.innerHTML = currentPendingBills.map((bill, index) => {
        const no = bill.invoiceNo || bill.purchaseNo;
        const date = new Date(bill.createdAt || bill.invoiceDate).toLocaleDateString('en-IN');
        return \`
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.6rem; font-weight: 900; color: var(--primary); letter-spacing: 1px;">\${no}</span>
                    <span style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">\${date}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 900; color: #fff;">₹\${Number(bill.outstandingAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
                        <div style="font-size: 0.55rem; color: var(--text-muted); font-weight: 700;">PENDING / ₹\${Number(bill.grandTotal).toLocaleString('en-IN')}</div>
                    </div>
                    <input type="number" step="0.01" class="bill-link-amt" data-index="\${index}" placeholder="0.00" oninput="updateLinkedTotal()" style="width: 100px; padding: 6px 10px; background: rgba(0,0,0,0.3); border: 1.5px solid var(--glass-border); border-radius: 8px; color: #fff; font-size: 0.8rem; text-align: right; font-weight: 800;">
                </div>
            </div>
        \`;
    }).join('');
    updateLinkedTotal();
}

function updateLinkedTotal() {
    const totalAmt = Number(document.getElementById('pay-amount').value) || 0;
    let linked = 0;
    document.querySelectorAll('.bill-link-amt').forEach(input => {
        linked += Number(input.value) || 0;
    });

    const badge = document.getElementById('linked-total-badge');
    if(badge) badge.innerText = \`LINKED: ₹\${linked.toLocaleString('en-IN', {minimumFractionDigits:2})}\`;
    
    const unallocated = totalAmt - linked;
    const unallocatedEl = document.getElementById('unallocated-amount');
    if(unallocatedEl) {
        unallocatedEl.innerText = \`₹\${Math.abs(unallocated).toLocaleString('en-IN', {minimumFractionDigits:2})} \${unallocated < 0 ? 'OVER' : ''}\`;
        unallocatedEl.style.color = unallocated < 0 ? '#ef4444' : (unallocated === 0 ? '#10b981' : '#f59e0b');
    }
}

function autoAllocatePayment() {
    let remaining = Number(document.getElementById('pay-amount').value) || 0;
    const inputs = document.querySelectorAll('.bill-link-amt');
    
    inputs.forEach(input => {
        const index = input.dataset.index;
        const bill = currentPendingBills[index];
        const outstanding = Number(bill.outstandingAmount);
        
        if (remaining > 0) {
            const allocate = Math.min(remaining, outstanding);
            input.value = allocate.toFixed(2);
            remaining -= allocate;
        } else {
            input.value = '';
        }
    });
    updateLinkedTotal();
}
`;

fs.appendFileSync(scriptPath, helpers);
console.log("SUCCESS: admin-script.js updated.");
