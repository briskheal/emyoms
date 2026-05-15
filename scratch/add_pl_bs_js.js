const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let scriptJS = fs.readFileSync(path, 'utf8');

const jsCode = `
async function loadFinancialStatements() {
    try {
        const res = await fetch('/api/admin/financial-statements');
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        renderPL(data.pl);
        renderBS(data.bs);
    } catch (e) { console.error("Finance load error", e); }
}

function renderPL(pl) {
    const container = document.getElementById('pl-results');
    if (!container) return;
    const fmt = v => '₹' + Number(v).toLocaleString('en-IN', {minimumFractionDigits:2});

    let html = \`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
        <!-- INCOME -->
        <div>
            <h4 style="color:#10b981; border-bottom:1px solid #10b981; padding-bottom:5px; font-size:0.8rem;">REVENUE / INCOME</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                \${pl.income.map(x => \`<tr><td style="padding:5px 0; color:var(--text-muted); font-size:0.75rem;">\${x.name}</td><td style="text-align:right; color:#fff; font-size:0.75rem;">\${fmt(x.amount)}</td></tr>\`).join('')}
                <tr style="border-top:1px solid var(--glass-border); font-weight:900;"><td style="padding:10px 0; color:#fff;">TOTAL INCOME</td><td style="text-align:right; color:#10b981;">\${fmt(pl.totalIncome)}</td></tr>
            </table>
        </div>
        <!-- EXPENSES -->
        <div>
            <h4 style="color:#ef4444; border-bottom:1px solid #ef4444; padding-bottom:5px; font-size:0.8rem;">OPERATIONAL EXPENSES</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                \${pl.expenses.map(x => \`<tr><td style="padding:5px 0; color:var(--text-muted); font-size:0.75rem;">\${x.name}</td><td style="text-align:right; color:#fff; font-size:0.75rem;">\${fmt(x.amount)}</td></tr>\`).join('')}
                <tr style="border-top:1px solid var(--glass-border); font-weight:900;"><td style="padding:10px 0; color:#fff;">TOTAL EXPENSES</td><td style="text-align:right; color:#ef4444;">\${fmt(pl.totalExpenses)}</td></tr>
            </table>
        </div>
    </div>
    <div style="margin-top:2rem; background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:12px; padding:1.5rem; text-align:center;">
        <div style="font-size:0.7rem; color:var(--text-muted); font-weight:900; letter-spacing:0.1em; margin-bottom:5px;">NET PROFIT / LOSS</div>
        <div style="font-size:2rem; font-weight:900; color:\${pl.netProfit >= 0 ? '#10b981' : '#ef4444'};">\${fmt(pl.netProfit)}</div>
    </div>\`;
    container.innerHTML = html;
}

function renderBS(bs) {
    const container = document.getElementById('bs-results');
    if (!container) return;
    const fmt = v => '₹' + Number(v).toLocaleString('en-IN', {minimumFractionDigits:2});

    let html = \`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
        <!-- LIABILITIES -->
        <div>
            <h4 style="color:#f59e0b; border-bottom:1px solid #f59e0b; padding-bottom:5px; font-size:0.8rem;">LIABILITIES & CAPITAL</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                \${bs.liabilities.map(x => \`<tr><td style="padding:5px 0; color:var(--text-muted); font-size:0.75rem;">\${x.name}</td><td style="text-align:right; color:#fff; font-size:0.75rem;">\${fmt(x.amount)}</td></tr>\`).join('')}
                <tr style="border-top:1px solid var(--glass-border); font-weight:900;"><td style="padding:10px 0; color:#fff;">TOTAL LIABILITIES</td><td style="text-align:right; color:#f59e0b;">\${fmt(bs.totalLiabilities)}</td></tr>
            </table>
        </div>
        <!-- ASSETS -->
        <div>
            <h4 style="color:#3b82f6; border-bottom:1px solid #3b82f6; padding-bottom:5px; font-size:0.8rem;">ASSETS</h4>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                \${bs.assets.map(x => \`<tr><td style="padding:5px 0; color:var(--text-muted); font-size:0.75rem;">\${x.name}</td><td style="text-align:right; color:#fff; font-size:0.75rem;">\${fmt(x.amount)}</td></tr>\`).join('')}
                <tr style="border-top:1px solid var(--glass-border); font-weight:900;"><td style="padding:10px 0; color:#fff;">TOTAL ASSETS</td><td style="text-align:right; color:#3b82f6;">\${fmt(bs.totalAssets)}</td></tr>
            </table>
        </div>
    </div>\`;
    container.innerHTML = html;
}

// Update switchFinanceTab to load statements
const origSwitchFinanceTab = switchFinanceTab;
switchFinanceTab = function(viewId, btnEl) {
    origSwitchFinanceTab(viewId, btnEl);
    if (viewId === 'pl-stmt' || viewId === 'balance-sheet') {
        loadFinancialStatements();
    }
};
`;

fs.appendFileSync(path, jsCode);

// Bump version
let html = fs.readFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', 'utf8');
html = html.replace('admin-script.js?v=3.3', 'admin-script.js?v=3.4');
fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', html);

console.log("SUCCESS: Finance Reports JS added.");
