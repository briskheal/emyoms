const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin-script.js');
let script = fs.readFileSync(filePath, 'utf8');

// 1. Update loadFinancialStatements
const oldLoadFS = `async function loadFinancialStatements() {
    try {
        const res = await fetch('/api/admin/financial-statements');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        renderPL(data.pl);
        renderBS(data.bs);
    } catch (e) { console.error("Finance load error", e); }
}`;

const newLoadFS = `async function loadFinancialStatements() {
    try {
        // Try to get dates from P&L or Balance Sheet inputs (they are synced)
        const from = document.getElementById('pl-from')?.value || document.getElementById('bs-from')?.value || '';
        const to = document.getElementById('pl-to')?.value || document.getElementById('bs-to')?.value || '';
        
        const res = await fetch(\`/api/admin/financial-statements?from=\${from}&to=\${to}\`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        renderPL(data.pl);
        renderBS(data.bs);
    } catch (e) { console.error("Finance load error", e); }
}`;

if (script.includes(oldLoadFS)) {
    script = script.replace(oldLoadFS, newLoadFS);
} else {
    console.log('loadFinancialStatements not found in admin-script.js');
}

// 2. Update loadTrialBalance
const oldLoadTB = `async function loadTrialBalance() {
    const tbody = document.getElementById('trial-balance-body');
    const tfoot = document.getElementById('trial-balance-foot');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading Trial Balance...</td></tr>';
    tfoot.innerHTML = '';

    try {
        const res = await fetch('/api/admin/trial-balance');
        const data = await res.json();`;

const newLoadTB = `async function loadTrialBalance() {
    const tbody = document.getElementById('trial-balance-body');
    const tfoot = document.getElementById('trial-balance-foot');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading Trial Balance...</td></tr>';
    tfoot.innerHTML = '';

    try {
        const from = document.getElementById('tb-from')?.value || '';
        const to = document.getElementById('tb-to')?.value || '';
        const res = await fetch(\`/api/admin/trial-balance?from=\${from}&to=\${to}\`);
        const data = await res.json();`;

if (script.includes(oldLoadTB)) {
    script = script.replace(oldLoadTB, newLoadTB);
} else {
    console.log('loadTrialBalance not found in admin-script.js');
}

fs.writeFileSync(filePath, script);
console.log('Updated admin-script.js with finance date filters');
