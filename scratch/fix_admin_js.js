const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let content = fs.readFileSync(path, 'utf8');

// Replacement 1: renderStockists datalist population
const target1 = `    // Update Party Stats
    const totalEl = document.getElementById('stat-total-parties');
    if (totalEl) {
        totalEl.innerText = allStockists.length;
        document.getElementById('stat-total-stockists').innerText = allStockists.filter(s => (s.partyType || 'STOCKIST') === 'STOCKIST').length;
        document.getElementById('stat-total-suppliers').innerText = allStockists.filter(s => s.partyType === 'SUPPLIER').length;
        document.getElementById('stat-pending-approval').innerText = allStockists.filter(s => !s.approved).length;
    }`;

const replacement1 = `    // Update Party Stats
    const totalEl = document.getElementById('stat-total-parties');
    if (totalEl) {
        totalEl.innerText = allStockists.length;
        document.getElementById('stat-total-stockists').innerText = allStockists.filter(s => (s.partyType || 'STOCKIST') === 'STOCKIST').length;
        document.getElementById('stat-total-suppliers').innerText = allStockists.filter(s => s.partyType === 'SUPPLIER').length;
        document.getElementById('stat-pending-approval').innerText = allStockists.filter(s => !s.approved).length;
    }

    // Populate Datalists for JV and Reports
    const sList = document.getElementById('stockist-list');
    const rList = document.getElementById('report-party-list');
    if (sList) {
        const options = allStockists.map(s => \`<option value="\${s.name}" data-id="\${s.id}"></option>\`).join('');
        sList.innerHTML = options;
        if (rList) rList.innerHTML = options;
    }`;

content = content.replace(target1, replacement1);

// Replacement 2: update addJvLine
const target2 = `        <div style="display:flex; gap: 4px;">
            <input type="hidden" class="jv-entity-id">
            <input type="text" class="jv-entity-name" required placeholder="Type name..." style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; width:100%;">
        </div>`;

const replacement2 = `        <div style="display:flex; gap: 4px; width:100%;">
            <input type="hidden" class="jv-entity-id">
            <input type="text" class="jv-entity-name" required list="stockist-list" placeholder="Select Name..." oninput="syncJvId(this)" style="padding:8px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; width:100%;">
        </div>`;

content = content.replace(target2, replacement2);

// Add syncJvId function
const syncFunc = `
function syncJvId(input) {
    const row = input.parentElement.parentElement;
    const ledger = row.querySelector('.jv-ledger').value;
    const idInput = row.querySelector('.jv-entity-id');
    const name = input.value;
    
    if (ledger === 'Stockist') {
        const s = allStockists.find(x => x.name === name);
        if (s) idInput.value = s.id;
        else idInput.value = '';
    }
}
`;

fs.writeFileSync(path, content + '\n' + syncFunc);
console.log('Successfully updated large JS file');
