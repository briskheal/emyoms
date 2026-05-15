const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let html = fs.readFileSync(path, 'utf8');

const newUI = `
            <!-- ACCOUNTS & LEDGERS TAB -->
            <div id="tab-jvs" class="hidden">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <h2 class="section-title" style="margin-bottom: 0.5rem;">&#128218; Accounts & Ledgers</h2>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">Trial Balance, Ledger Statements, and Journal Entries.</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; background:rgba(255,255,255,0.03); padding:5px; border-radius:10px; border:1px solid var(--glass-border);">
                        <button onclick="switchFinanceTab('trial-balance', this)" class="btn btn-primary finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Trial Balance</button>
                        <button onclick="switchFinanceTab('ledger-stmt', this)" class="btn btn-ghost finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Ledger Statement</button>
                        <button onclick="switchFinanceTab('jv-register', this)" class="btn btn-ghost finance-nav-btn" style="padding:6px 14px; font-size:0.75rem;">Journal Entries</button>
                    </div>
                </div>
                
                <!-- TRIAL BALANCE VIEW -->
                <div id="finance-view-trial-balance" class="glass-card finance-view" style="padding: 0; overflow: hidden;">
                    <div style="padding:1.5rem; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1rem; color:#f59e0b;">Trial Balance</h3>
                        <button class="btn btn-ghost" onclick="loadTrialBalance()" style="padding:6px 12px; font-size:0.75rem;">&#8635; Refresh</button>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th style="padding:10px 15px; color:#f59e0b;">GROUP / CATEGORY</th>
                                    <th style="padding:10px 15px; color:var(--text-muted);">LEDGER NAME</th>
                                    <th style="padding:10px 15px; text-align:right; color:#10b981;">DEBIT (DR)</th>
                                    <th style="padding:10px 15px; text-align:right; color:#ef4444;">CREDIT (CR)</th>
                                </tr>
                            </thead>
                            <tbody id="trial-balance-body">
                                <tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading...</td></tr>
                            </tbody>
                            <tfoot id="trial-balance-foot">
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- LEDGER STATEMENT VIEW -->
                <div id="finance-view-ledger-stmt" class="glass-card finance-view hidden" style="padding: 1.5rem; min-height:400px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
                        <div>
                            <h3 style="margin:0 0 0.5rem 0; font-size:1rem; color:#a855f7;">Ledger Statement</h3>
                            <div style="font-size:0.7rem; color:var(--text-muted);">Select an account to view all postings.</div>
                        </div>
                        <div style="display:flex; gap:0.5rem; align-items:center; background:rgba(0,0,0,0.4); padding:8px 12px; border-radius:12px; border:1px solid var(--glass-border);">
                            <select id="ledger-stmt-type" onchange="onLedgerStmtTypeChange()" style="padding:7px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-size:0.75rem;">
                                <option value="Ledger">Ledger Account</option>
                                <option value="Stockist">Party / Stockist</option>
                                <option value="ExpenseCategory">Expense Head</option>
                            </select>
                            <div style="position:relative; width:220px;">
                                <input type="hidden" id="ledger-stmt-id">
                                <input type="text" id="ledger-stmt-search" list="jv-entity-list" placeholder="Search..." oninput="syncLedgerStmtId(this)" style="width:100%; padding:7px 10px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-size:0.75rem; box-sizing:border-box;">
                            </div>
                            <button class="btn btn-primary" onclick="loadLedgerStatement()" style="padding:7px 16px; font-size:0.75rem; background:linear-gradient(135deg,#a855f7,#7e22ce); border:none;">VIEW</button>
                        </div>
                    </div>
                    
                    <div id="ledger-stmt-results">
                        <div style="text-align:center; padding:3rem; color:var(--text-muted); font-size:0.8rem;">Select a ledger and click View.</div>
                    </div>
                </div>

                <!-- JOURNAL REGISTER VIEW -->
                <div id="finance-view-jv-register" class="glass-card finance-view hidden" style="padding: 0; overflow: hidden;">
                    <div style="padding:1.5rem; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1rem; color:#10b981;">Journal Register</h3>
                        <button class="btn btn-primary" onclick="openJvModal()" style="padding:6px 16px; font-size:0.75rem;">&#43; ADD JV</button>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th style="width: 100px;">JV NO</th>
                                    <th style="width: 100px;">DATE</th>
                                    <th>NARRATION</th>
                                    <th style="text-align: right; width: 150px;">TOTAL (&#8377;)</th>
                                </tr>
                            </thead>
                            <tbody id="jv-grid-body">
                                <tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading JVs...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

const startIdx = html.indexOf('<div id="tab-jvs" class="hidden">');
const endStr = '<!-- SETTINGS TAB -->';
const endIdx = html.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    html = html.substring(0, startIdx) + newUI + "\n\n            " + html.substring(endIdx);
    // also update sidebar item text
    html = html.replace("?? Journal Entries (JV)", "&#128218; Accounts & Ledgers");
    fs.writeFileSync(path, html);
    console.log("SUCCESS: UI updated.");
} else {
    console.log("Failed. start:", startIdx, "end:", endIdx);
}
