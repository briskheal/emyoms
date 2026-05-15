// --- JOURNAL ENTRY (JV) MODULE ---

function openJvModal() {
    document.getElementById('jv-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('jv-narration').value = '';
    document.getElementById('jv-lines-container').innerHTML = '';
    addJvLine();
    addJvLine();
    calculateJvTotals();
    document.getElementById('jvModal').classList.remove('hidden');
}

function addJvLine() {
    const container = document.getElementById('jv-lines-container');
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '80px 150px 250px 1fr 1fr 50px';
    row.style.gap = '0.5rem';
    row.style.marginBottom = '0.5rem';
    
    // Entity options based on system
    let entityOptions = `<option value="">-- Name --</option>`;
    
    row.innerHTML = `
        <select class="jv-type" onchange="calculateJvTotals()" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff;">
            <option value="DR">DR</option>
            <option value="CR">CR</option>
        </select>
        <select class="jv-ledger" onchange="updateJvEntityOptions(this)" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff;">
            <option value="Stockist">Stockist</option>
            <option value="ExpenseCategory">Expense Header</option>
            <option value="Bank">Bank Account</option>
            <option value="SystemLedger">System Ledger</option>
        </select>
        <div style="display:flex; gap: 4px;">
            <input type="hidden" class="jv-entity-id">
            <input type="text" class="jv-entity-name" required placeholder="Type name..." style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; width:100%;">
        </div>
        <input type="text" class="jv-notes" placeholder="Optional notes" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff;">
        <input type="number" class="jv-amount" required step="0.01" min="0.01" value="0.00" oninput="calculateJvTotals()" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-weight:bold; text-align:right;">
        <button type="button" onclick="removeJvLine(this)" class="btn btn-ghost" style="color:#ef4444; padding:8px;"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function updateJvEntityOptions(selectElem) {
    // In a full implementation, this would populate a dropdown or autocomplete for the entityName field.
    // For now, it's a free-text input field so the accountant can type the name directly.
}

function removeJvLine(btn) {
    const container = document.getElementById('jv-lines-container');
    if (container.children.length <= 2) return alert("A Journal Entry must have at least two lines.");
    btn.parentElement.remove();
    calculateJvTotals();
}

function calculateJvTotals() {
    let dr = 0, cr = 0;
    document.querySelectorAll('#jv-lines-container > div').forEach(row => {
        const type = row.querySelector('.jv-type').value;
        const amt = Number(row.querySelector('.jv-amount').value) || 0;
        if (type === 'DR') dr += amt;
        else cr += amt;
    });
    
    document.getElementById('jv-total-dr').innerText = '₹' + dr.toFixed(2);
    document.getElementById('jv-total-cr').innerText = '₹' + cr.toFixed(2);
    
    const saveBtn = document.getElementById('save-jv-btn');
    if (dr > 0 && Math.abs(dr - cr) < 0.01) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> POST JOURNAL ENTRY';
        saveBtn.style.opacity = '1';
    } else {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⚠️ TOTALS MUST MATCH';
        saveBtn.style.opacity = '0.5';
    }
}

async function saveJv(e) {
    e.preventDefault();
    
    const lines = [];
    document.querySelectorAll('#jv-lines-container > div').forEach(row => {
        lines.push({
            type: row.querySelector('.jv-type').value,
            entityType: row.querySelector('.jv-ledger').value,
            entityId: row.querySelector('.jv-entity-id').value || null,
            entityName: row.querySelector('.jv-entity-name').value,
            notes: row.querySelector('.jv-notes').value,
            amount: Number(row.querySelector('.jv-amount').value)
        });
    });

    const payload = {
        date: document.getElementById('jv-date').value,
        narration: document.getElementById('jv-narration').value,
        lines
    };

    const btn = document.getElementById('save-jv-btn');
    btn.disabled = true;
    btn.innerHTML = '⏳ POSTING...';

    try {
        const res = await fetch('/api/admin/journal-vouchers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('jvModal').classList.add('hidden');
            loadJvs();
            // Show toast
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.innerHTML = `<i class="fas fa-check-circle"></i> JV ${data.jv.jvNo} posted successfully!`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            alert(data.error || 'Failed to post JV');
            calculateJvTotals(); // Reset button
        }
    } catch(err) {
        alert(err.message);
        calculateJvTotals();
    }
}

let jvDataList = [];
async function loadJvs() {
    try {
        const res = await fetch('/api/admin/journal-vouchers');
        jvDataList = await res.json();
        renderJvs();
    } catch(e) { console.error('JV Load Error:', e); }
}

function renderJvs() {
    const tbody = document.getElementById('jvs-grid');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    if (!jvDataList || jvDataList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No Journal Entries found.</td></tr>';
        return;
    }

    jvDataList.forEach(jv => {
        tbody.innerHTML += `
            <tr>
                <td><strong style="color: #a855f7;">${jv.jvNo}</strong></td>
                <td>${new Date(jv.date).toLocaleDateString()}</td>
                <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${jv.narration}">${jv.narration}</td>
                <td style="color: #ef4444; font-weight: bold;">₹${Number(jv.totalAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td style="color: #10b981; font-weight: bold;">₹${Number(jv.totalAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td>
                    <button class="btn btn-ghost" onclick="viewJv(${jv.id})" style="padding: 4px 8px; font-size: 0.7rem;"><i class="fas fa-eye"></i> View Details</button>
                </td>
            </tr>
        `;
    });
}

function viewJv(id) {
    const jv = jvDataList.find(j => j.id === id);
    if (!jv) return;
    
    let linesHtml = jv.lines.map(l => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div>
                <span style="display:inline-block; width:30px; font-weight:bold; color: ${l.type==='DR'?'#ef4444':'#10b981'}">${l.type}</span>
                <span style="color: var(--text-muted); font-size: 0.8rem; margin-right: 8px;">[${l.entityType}]</span>
                <strong style="color: #fff;">${l.entityName}</strong>
                ${l.notes ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-left: 38px;">Note: ${l.notes}</div>` : ''}
            </div>
            <div style="font-weight:bold; color: ${l.type==='DR'?'#ef4444':'#10b981'}">₹${Number(l.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
        </div>
    `).join('');

    alert(`JV NO: ${jv.jvNo}\\nDate: ${new Date(jv.date).toLocaleDateString()}\\nNarration: ${jv.narration}\\n\\nLines:\\n${jv.lines.map(l => `${l.type} | ${l.entityType} | ${l.entityName} | Rs. ${l.amount}`).join('\\n')}`);
}

// Hook into existing initialLoad function if possible, otherwise just call loadJvs()
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to load JVs when the dashboard boots up
    loadJvs();
});
