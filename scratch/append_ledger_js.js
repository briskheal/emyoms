const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let content = fs.readFileSync(path, 'utf8');

// === Append Ledger Master JS ===
const ledgerJS = `

// =============================================
// LEDGER MASTER MODULE
// =============================================

let allLedgers = [];
let allLedgerEntities = []; // Combined: Stockists + Ledgers + ExpCats

async function loadLedgers() {
    try {
        const res = await fetch('/api/admin/ledgers');
        allLedgers = await res.json();
        renderLedgerMasterList();

        // Also refresh combined entity list for JV autocomplete
        const res2 = await fetch('/api/admin/all-ledger-entities');
        const data = await res2.json();
        allLedgerEntities = [
            ...(data.stockists || []),
            ...(data.ledgers   || []),
            ...(data.expCats   || [])
        ];
        populateJvEntityDatalist();
    } catch(e) { console.error('Load ledgers failed', e); }
}

function renderLedgerMasterList() {
    const container = document.getElementById('ledger-master-list');
    if (!container) return;

    if (!allLedgers.length) {
        container.innerHTML = '<div style="padding:1rem; color:var(--text-muted); font-size:0.75rem;">No ledgers yet. Add one above.</div>';
        return;
    }

    // Group by group name
    const grouped = {};
    allLedgers.forEach(l => {
        if (!grouped[l.group]) grouped[l.group] = [];
        grouped[l.group].push(l);
    });

    let html = '';
    Object.keys(grouped).sort().forEach(grp => {
        html += '<div style="margin-bottom:0.5rem;">';
        html += '<div style="font-size:0.6rem; font-weight:900; color:#a855f7; letter-spacing:0.1em; padding: 4px 8px; background: rgba(168,85,247,0.08); border-radius:4px; margin-bottom:4px;">' + grp.toUpperCase() + '</div>';
        grouped[grp].forEach(l => {
            html += '<div style="display:flex; align-items:center; gap:0.5rem; padding:5px 8px; border-radius:6px; margin-bottom:2px; background:rgba(255,255,255,0.02);">';
            html += '<span style="font-size:0.65rem; font-weight:800; background:' + (l.nature==='DR'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)') + '; color:' + (l.nature==='DR'?'#10b981':'#ef4444') + '; padding:1px 6px; border-radius:4px;">' + l.nature + '</span>';
            html += '<span style="flex:1; font-size:0.78rem; color:#fff;">' + l.name + '</span>';
            html += '<span style="font-size:0.7rem; color:var(--text-muted);">Bal: ₹' + Number(l.openingBalance||0).toLocaleString('en-IN',{minimumFractionDigits:2}) + '</span>';
            html += '<button onclick="deleteLedger(' + l.id + ')" class="btn btn-ghost" style="padding:2px 6px; font-size:0.65rem; color:#ef4444;">✕</button>';
            html += '</div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
}

async function addLedger() {
    const name   = (document.getElementById('new-ledger-name')?.value || '').trim();
    const group  = document.getElementById('new-ledger-group')?.value;
    const nature = document.getElementById('new-ledger-nature')?.value;
    const ob     = Number(document.getElementById('new-ledger-ob')?.value) || 0;

    if (!name) return alert('Please enter a ledger name.');

    try {
        const res = await fetch('/api/admin/ledgers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name, group, nature, openingBalance: ob })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('new-ledger-name').value = '';
            document.getElementById('new-ledger-ob').value = '0';
            await loadLedgers();
        } else {
            alert(data.error || 'Failed to add ledger');
        }
    } catch(e) { alert(e.message); }
}

async function deleteLedger(id) {
    if (!confirm('Delete this ledger?')) return;
    try {
        await fetch('/api/admin/ledgers/' + id, { method: 'DELETE' });
        await loadLedgers();
    } catch(e) { alert(e.message); }
}

function populateJvEntityDatalist() {
    // Build a combined datalist for the JV entity name field
    const list = document.getElementById('jv-entity-list');
    if (!list) {
        // Create it if not present
        const dl = document.createElement('datalist');
        dl.id = 'jv-entity-list';
        document.body.appendChild(dl);
    }
    const dl = document.getElementById('jv-entity-list');
    dl.innerHTML = allLedgerEntities.map(e => '<option value="' + e.name + '" data-type="' + e.entityType + '" data-id="' + e.id + '"></option>').join('');
}

// Override addJvLine to use the combined smart datalist
function addJvLine() {
    const container = document.getElementById('jv-lines-container');
    const row = document.createElement('div');
    row.style.cssText = 'display:grid; grid-template-columns:70px 130px 1fr 1fr 120px 40px; gap:0.5rem; margin-bottom:0.5rem; align-items:center;';

    row.innerHTML = \`
        <select class="jv-type" onchange="calculateJvTotals()" style="padding:7px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-weight:900;">
            <option value="DR" style="color:#10b981;">DR</option>
            <option value="CR" style="color:#ef4444;">CR</option>
        </select>
        <select class="jv-ledger" onchange="onJvLedgerChange(this)" style="padding:7px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.75rem;">
            <option value="Stockist">Stockist / Party</option>
            <option value="Ledger">Ledger A/c</option>
            <option value="ExpenseCategory">Expense Head</option>
        </select>
        <div style="position:relative;">
            <input type="hidden" class="jv-entity-id">
            <input type="text" class="jv-entity-name" list="jv-entity-list" required placeholder="Search name..." oninput="syncJvId(this)" style="width:100%; padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem; box-sizing:border-box;">
        </div>
        <input type="text" class="jv-notes" placeholder="Notes (optional)" style="padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.75rem;">
        <input type="number" class="jv-amount" required step="0.01" min="0.01" value="" oninput="calculateJvTotals()" style="padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid #a855f7; border-radius:8px; color:#a855f7; font-weight:900; font-size:0.9rem; text-align:right;">
        <button type="button" onclick="removeJvLine(this)" class="btn btn-ghost" style="color:#ef4444; padding:5px; border-radius:6px; font-size:0.9rem;">✕</button>
    \`;
    container.appendChild(row);
}

function onJvLedgerChange(selectEl) {
    const row = selectEl.parentElement;
    const nameInput = row.querySelector('.jv-entity-name');
    const type = selectEl.value;
    
    // Update placeholder
    if (type === 'Stockist') nameInput.placeholder = 'Search stockist / party...';
    else if (type === 'Ledger') nameInput.placeholder = 'Search ledger account...';
    else nameInput.placeholder = 'Search expense head...';
    
    nameInput.value = '';
    row.querySelector('.jv-entity-id').value = '';
}

// Override syncJvId to use combined entity list
function syncJvId(input) {
    const row = input.parentElement.parentElement;
    const ledgerType = row.querySelector('.jv-ledger').value;
    const name = input.value;
    
    const entity = allLedgerEntities.find(e => e.name === name && e.entityType === ledgerType);
    const idInput = row.querySelector('.jv-entity-id');
    idInput.value = entity ? entity.id : '';
}
`;

fs.appendFileSync(path, ledgerJS);
console.log('SUCCESS: Ledger Master JS appended. Total size:', fs.statSync(path).size);
