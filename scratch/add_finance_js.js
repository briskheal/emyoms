const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let scriptJS = fs.readFileSync(path, 'utf8');

const jsCode = `
// =============================================
// ACCOUNTS & LEDGERS (Finance Views)
// =============================================

function switchFinanceTab(viewId, btnEl) {
    document.querySelectorAll('.finance-view').forEach(el => el.classList.add('hidden'));
    document.getElementById('finance-view-' + viewId).classList.remove('hidden');

    document.querySelectorAll('.finance-nav-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-ghost');
    });
    btnEl.classList.remove('btn-ghost');
    btnEl.classList.add('btn-primary');

    if (viewId === 'trial-balance') loadTrialBalance();
    if (viewId === 'jv-register') loadJvGrid();
}

async function loadTrialBalance() {
    const tbody = document.getElementById('trial-balance-body');
    const tfoot = document.getElementById('trial-balance-foot');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading Trial Balance...</td></tr>';
    tfoot.innerHTML = '';

    try {
        const res = await fetch('/api/admin/trial-balance');
        const data = await res.json();
        
        if (!data.success) throw new Error(data.error);

        let html = '';
        let totalDr = 0;
        let totalCr = 0;
        const fmt = v => '₹' + Number(v).toLocaleString('en-IN', {minimumFractionDigits:2});

        // Grouping
        const groups = {};
        data.trialBalance.forEach(row => {
            if (!groups[row.group]) groups[row.group] = [];
            groups[row.group].push(row);
        });

        Object.keys(groups).sort().forEach(grp => {
            html += \`<tr><td colspan="4" style="padding:10px 15px; background:rgba(255,255,255,0.03); color:#f59e0b; font-weight:900; font-size:0.65rem; letter-spacing:0.1em;">\${grp.toUpperCase()}</td></tr>\`;
            groups[grp].sort((a,b)=>a.name.localeCompare(b.name)).forEach(row => {
                totalDr += row.dr;
                totalCr += row.cr;
                html += \`
                <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
                    <td style="padding:8px 15px;"></td>
                    <td style="padding:8px 15px; color:#fff; font-size:0.8rem;">\${row.name}</td>
                    <td style="padding:8px 15px; text-align:right; color:#10b981; font-family:monospace; font-size:0.85rem;">\${row.dr > 0 ? fmt(row.dr) : '-'}</td>
                    <td style="padding:8px 15px; text-align:right; color:#ef4444; font-family:monospace; font-size:0.85rem;">\${row.cr > 0 ? fmt(row.cr) : '-'}</td>
                </tr>\`;
            });
        });

        if (data.trialBalance.length === 0) {
            html = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">No entries found.</td></tr>';
        }

        tbody.innerHTML = html;

        // Difference check
        const diff = Math.abs(totalDr - totalCr);
        const diffHtml = diff > 0.01 
            ? \`<div style="color:#ef4444; font-size:0.7rem; margin-top:4px;">Difference: \${fmt(diff)}</div>\` 
            : \`<div style="color:#10b981; font-size:0.7rem; margin-top:4px;">Matched</div>\`;

        tfoot.innerHTML = \`
            <tr style="background:rgba(0,0,0,0.5); font-weight:900;">
                <td colspan="2" style="padding:12px 15px; text-align:right; color:#fff;">GRAND TOTAL</td>
                <td style="padding:12px 15px; text-align:right; color:#10b981; font-size:0.95rem;">\${fmt(totalDr)} \${diffHtml}</td>
                <td style="padding:12px 15px; text-align:right; color:#ef4444; font-size:0.95rem;">\${fmt(totalCr)} \${diffHtml}</td>
            </tr>\`;

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:#ef4444;">Error: ' + e.message + '</td></tr>';
    }
}

function onLedgerStmtTypeChange() {
    const type = document.getElementById('ledger-stmt-type').value;
    const nameInput = document.getElementById('ledger-stmt-search');
    nameInput.value = '';
    document.getElementById('ledger-stmt-id').value = '';
    
    if (type === 'Stockist') nameInput.placeholder = 'Search party...';
    else if (type === 'Ledger') nameInput.placeholder = 'Search ledger account...';
    else nameInput.placeholder = 'Search expense head...';
}

function syncLedgerStmtId(input) {
    const type = document.getElementById('ledger-stmt-type').value;
    const entity = allLedgerEntities.find(e => e.name === input.value && e.entityType === type);
    document.getElementById('ledger-stmt-id').value = entity ? entity.id : '';
}

async function loadLedgerStatement() {
    const type = document.getElementById('ledger-stmt-type').value;
    const id = document.getElementById('ledger-stmt-id').value;
    const name = document.getElementById('ledger-stmt-search').value;
    const container = document.getElementById('ledger-stmt-results');

    if (!id) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; color:#ef4444;">Please select a valid ledger from the list.</div>';
        return;
    }

    container.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading statement...</div>';

    try {
        const res = await fetch(\`/api/admin/ledger-statement?type=\${type}&id=\${id}\`);
        const data = await res.json();
        
        if (!data.success) throw new Error(data.error);

        let runningBal = data.openingBalance;
        let balType = data.obType; // DR or CR

        const fmt = v => '₹' + Number(Math.abs(v)).toLocaleString('en-IN', {minimumFractionDigits:2});
        
        // Header
        let html = \`
        <div style="background:rgba(255,255,255,0.02); padding:1rem; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:1rem;">
            <div style="font-size:0.6rem; color:var(--text-muted); font-weight:900; letter-spacing:0.1em; margin-bottom:4px;">LEDGER ACCOUNT</div>
            <div style="font-size:1.2rem; font-weight:900; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                \${name}
                <span style="font-size:0.8rem; padding:4px 10px; background:rgba(0,0,0,0.5); border-radius:8px;">
                    <span style="color:var(--text-muted); font-size:0.6rem; margin-right:5px;">OPENING BAL:</span> 
                    \${fmt(runningBal)} <span style="font-size:0.6rem; color:\${balType==='DR'?'#10b981':'#ef4444'};">\${balType}</span>
                </span>
            </div>
        </div>
        <div style="overflow-x:auto;">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th>DATE</th>
                        <th>VOUCHER NO</th>
                        <th>PARTICULARS</th>
                        <th style="text-align:right;">DEBIT (DR)</th>
                        <th style="text-align:right;">CREDIT (CR)</th>
                        <th style="text-align:right;">BALANCE</th>
                    </tr>
                </thead>
                <tbody>
        \`;

        // We need to keep a numerical running balance where DR is positive and CR is negative (or vice versa)
        // Let's standardise: DR = positive, CR = negative for calculation.
        let calcBal = balType === 'DR' ? Number(runningBal) : -Number(runningBal);

        data.lines.forEach(line => {
            const v = line.voucher;
            const amt = Number(line.amount);
            
            if (line.type === 'DR') calcBal += amt;
            else calcBal -= amt;

            const currentBalType = calcBal >= 0 ? 'DR' : 'CR';
            
            html += \`
            <tr style="border-bottom:1px solid rgba(255,255,255,0.02);">
                <td style="font-size:0.75rem; color:var(--text-muted);">\${new Date(v.date).toLocaleDateString('en-IN')}</td>
                <td style="font-size:0.75rem; color:#a855f7; font-weight:900;">\${v.jvNo}</td>
                <td style="font-size:0.75rem;">
                    <div style="color:#fff;">\${v.narration || '-'}</div>
                    \${line.notes ? \`<div style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;">\${line.notes}</div>\` : ''}
                </td>
                <td style="text-align:right; color:#10b981; font-family:monospace;">\${line.type === 'DR' ? fmt(amt) : ''}</td>
                <td style="text-align:right; color:#ef4444; font-family:monospace;">\${line.type === 'CR' ? fmt(amt) : ''}</td>
                <td style="text-align:right; font-family:monospace; font-weight:800; color:\${currentBalType==='DR'?'#10b981':'#ef4444'}">
                    \${fmt(calcBal)} <span style="font-size:0.6rem;">\${currentBalType}</span>
                </td>
            </tr>\`;
        });

        if (data.lines.length === 0) {
            html += '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No transactions found for this ledger.</td></tr>';
        } else {
            const finalBalType = calcBal >= 0 ? 'DR' : 'CR';
            html += \`
            <tr style="background:rgba(0,0,0,0.4); font-weight:900;">
                <td colspan="3" style="text-align:right; color:#fff;">CLOSING BALANCE</td>
                <td colspan="3" style="text-align:right; font-size:1rem; color:\${finalBalType==='DR'?'#10b981':'#ef4444'};">
                    \${fmt(calcBal)} <span style="font-size:0.7rem;">\${finalBalType}</span>
                </td>
            </tr>\`;
        }

        html += '</tbody></table></div>';
        container.innerHTML = html;

    } catch (e) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; color:#ef4444;">Error: ' + e.message + '</div>';
    }
}

// Ensure loadTrialBalance is called when tab is activated from sidebar
const origSwitchTab = switchTab;
switchTab = function(tabId, el, ...args) {
    origSwitchTab(tabId, el, ...args);
    if (tabId === 'jvs') {
        loadTrialBalance(); // Default view in Accounts & Ledgers
    }
};
`;

fs.appendFileSync(path, jsCode);

// Bump version in admin.html
let html = fs.readFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', 'utf8');
html = html.replace('admin-script.js?v=3.2', 'admin-script.js?v=3.3');
fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', html);

console.log("SUCCESS: Finance JS appended.");
