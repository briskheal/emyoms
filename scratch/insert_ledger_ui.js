const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

// Use line 741 as injection point: just before <!-- DOCUMENT NUMBERING MASTER -->
const marker = '                    <!-- DOCUMENT NUMBERING MASTER -->';
const idx = content.indexOf(marker);
if (idx < 0) { console.error('Marker not found'); process.exit(1); }

const ledgerBlock = `                    <!-- LEDGER MASTER (Chart of Accounts) -->
                    <div class="glass-card" style="grid-column: 1 / -1; margin-top: 1rem; border: 1px solid #a855f7;">
                        <h3 class="section-title" style="font-size: 0.8rem; color: #a855f7;"><i class="fas fa-book"></i> Ledger Master (Chart of Accounts)</h3>
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 1rem;">Create Bank, Capital, Tax, and other accounts for use in Journal Entries.</p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 140px 90px 80px; gap: 0.5rem; margin-bottom: 1rem; align-items: end;">
                            <div>
                                <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:3px;">LEDGER NAME</div>
                                <input type="text" id="new-ledger-name" placeholder="e.g. HDFC Current A/c" style="width:100%; padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                            </div>
                            <div>
                                <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:3px;">GROUP</div>
                                <select id="new-ledger-group" style="width:100%; padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                                    <option value="Bank">Bank</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Capital">Capital</option>
                                    <option value="Loan">Loan</option>
                                    <option value="Tax Payable">Tax Payable</option>
                                    <option value="Fixed Assets">Fixed Assets</option>
                                    <option value="Stock">Stock</option>
                                    <option value="Sundry Creditor">Sundry Creditor</option>
                                    <option value="Sundry Debtor">Sundry Debtor</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:3px;">NATURE</div>
                                <select id="new-ledger-nature" style="width:100%; padding:7px 10px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                                    <option value="DR">DR (Asset)</option>
                                    <option value="CR">CR (Liability)</option>
                                </select>
                            </div>
                            <div>
                                <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:3px;">OP. BAL (&#8377;)</div>
                                <input type="number" id="new-ledger-ob" value="0" step="0.01" style="width:100%; padding:7px 6px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                            </div>
                            <div>
                                <div style="font-size:0.6rem; color: transparent; margin-bottom:3px;">-</div>
                                <button class="btn btn-primary" style="width:100%; padding:7px 10px; background: linear-gradient(135deg, #a855f7, #7e22ce); border:none;" onclick="addLedger()">ADD</button>
                            </div>
                        </div>
                        <div id="ledger-master-list" style="max-height: 260px; overflow-y: auto;"></div>
                    </div>

                    <!-- DOCUMENT NUMBERING MASTER -->`;

content = content.slice(0, idx) + ledgerBlock + content.slice(idx + marker.length);
fs.writeFileSync(path, content);
console.log('SUCCESS: Ledger Master UI injected. File size:', content.length);
