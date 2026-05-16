const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(filePath, 'utf8');

// Helper to add filters to a specific view
const addFilters = (viewId, title) => {
    const oldStr = `<h3 style="margin:0 0 1.5rem 0; font-size:1rem; color:#10b981;">Profit & Loss Statement</h3>`;
    const newStr = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3 style="margin:0; font-size:1rem; color:#10b981;">Profit & Loss Statement</h3>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="date" id="pl-from" style="padding:4px 8px; font-size:0.75rem; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; border-radius:6px;">
                            <input type="date" id="pl-to" style="padding:4px 8px; font-size:0.75rem; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; border-radius:6px;">
                            <button onclick="loadFinancialStatements()" class="btn btn-primary" style="padding:4px 12px; font-size:0.75rem;">REFRESH</button>
                        </div>
                    </div>`;
    
    // Replace Profit & Loss
    html = html.replace(`<h3 style="margin:0 0 1.5rem 0; font-size:1rem; color:#10b981;">Profit & Loss Statement</h3>`, newStr);

    // Replace Balance Sheet
    const bsOld = `<h3 style="margin:0 0 1.5rem 0; font-size:1rem; color:#3b82f6;">Balance Sheet</h3>`;
    const bsNew = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3 style="margin:0; font-size:1rem; color:#3b82f6;">Balance Sheet</h3>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="date" id="bs-from" style="padding:4px 8px; font-size:0.75rem; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; border-radius:6px;">
                            <input type="date" id="bs-to" style="padding:4px 8px; font-size:0.75rem; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; border-radius:6px;">
                            <button onclick="loadFinancialStatements()" class="btn btn-primary" style="padding:4px 12px; font-size:0.75rem;">REFRESH</button>
                        </div>
                    </div>`;
    html = html.replace(bsOld, bsNew);

    // Replace Trial Balance
    const tbOld = `<h3 style="margin:0 0 1.5rem 0; font-size:1rem; color:#f59e0b;">Trial Balance</h3>`;
    const tbNew = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3 style="margin:0; font-size:1rem; color:#f59e0b;">Trial Balance</h3>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <input type="date" id="tb-from" style="padding:4px 8px; font-size:0.75rem; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; border-radius:6px;">
                            <input type="date" id="tb-to" style="padding:4px 8px; font-size:0.75rem; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; border-radius:6px;">
                            <button onclick="loadTrialBalance()" class="btn btn-primary" style="padding:4px 12px; font-size:0.75rem;">REFRESH</button>
                        </div>
                    </div>`;
    html = html.replace(tbOld, tbNew);
};

addFilters();
fs.writeFileSync(filePath, html);
console.log('Added date filters to Finance views in admin.html');
