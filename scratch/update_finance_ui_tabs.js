const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let html = fs.readFileSync(path, 'utf8');

const oldNav = `<button onclick="switchFinanceTab('trial-balance', this)" class="btn btn-primary finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Trial Balance</button>
                        <button onclick="switchFinanceTab('ledger-stmt', this)" class="btn btn-ghost finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Ledger Statement</button>
                        <button onclick="switchFinanceTab('jv-register', this)" class="btn btn-ghost finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Journal Entries</button>`;

const newNav = `<button onclick="switchFinanceTab('trial-balance', this)" class="btn btn-primary finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Trial Balance</button>
                        <button onclick="switchFinanceTab('ledger-stmt', this)" class="btn btn-ghost finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Ledger Statement</button>
                        <button onclick="switchFinanceTab('pl-stmt', this)" class="btn btn-ghost finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">P&L Statement</button>
                        <button onclick="switchFinanceTab('balance-sheet', this)" class="btn btn-ghost finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Balance Sheet</button>
                        <button onclick="switchFinanceTab('jv-register', this)" class="btn btn-ghost finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Journal Entries</button>`;

html = html.replace(oldNav, newNav);

const plView = `
                <!-- P&L STATEMENT VIEW -->
                <div id="finance-view-pl-stmt" class="glass-card finance-view hidden" style="padding: 1.5rem;">
                    <h3 style="margin:0 0 1.5rem 0; font-size:1rem; color:#10b981;">Profit & Loss Statement</h3>
                    <div id="pl-results">
                        <div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading P&L...</div>
                    </div>
                </div>

                <!-- BALANCE SHEET VIEW -->
                <div id="finance-view-balance-sheet" class="glass-card finance-view hidden" style="padding: 1.5rem;">
                    <h3 style="margin:0 0 1.5rem 0; font-size:1rem; color:#3b82f6;">Balance Sheet</h3>
                    <div id="bs-results">
                        <div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading Balance Sheet...</div>
                    </div>
                </div>`;

const insertionPoint = '<!-- JOURNAL REGISTER VIEW -->';
html = html.replace(insertionPoint, plView + '\n\n                ' + insertionPoint);

fs.writeFileSync(path, html);
console.log("SUCCESS: UI updated with P&L and Balance Sheet tabs.");
