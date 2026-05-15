const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let html = fs.readFileSync(path, 'utf8');

const lines = html.split('\n');

const newCard = `                    <!-- EXPENSE MANAGEMENT: Full Grid -->
                    <div class="glass-card" style="padding: 1.5rem; border-top: 4px solid #ef4444; grid-column: 1 / -1;">
                        <!-- Header Row -->
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
                            <h3 class="section-title" style="font-size: 1rem; margin:0;">&#128184; Expense Register</h3>
                            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
                                <input type="text" id="exp-search" oninput="filterExpenses()" placeholder="&#128269; Search by head, narration..." style="padding:6px 12px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.75rem; width:220px;">
                                <select id="exp-filter-type" onchange="filterExpenses()" style="padding:6px 10px; background:rgba(0,0,0,0.4); border:1px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.75rem;">
                                    <option value="">All Types</option>
                                    <option value="Direct">Direct</option>
                                    <option value="Indirect">Indirect</option>
                                </select>
                                <button class="btn btn-primary" onclick="openExpenseModal()" style="padding:6px 16px; font-size:0.75rem; background:linear-gradient(135deg,#ef4444,#f97316); border:none;">
                                    &#43; LOG EXPENSE
                                </button>
                                <button class="btn btn-ghost" onclick="generateReport('expense-transaction')" style="padding:6px 12px; font-size:0.75rem;">
                                    &#128196; PDF Report
                                </button>
                            </div>
                        </div>

                        <!-- Summary Strip -->
                        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; margin-bottom:1rem;">
                            <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:10px 14px; text-align:center;">
                                <div style="font-size:0.55rem; color:#ef4444; font-weight:900; letter-spacing:0.1em;">TOTAL EXPENSES</div>
                                <div id="exp-stat-total" style="font-size:1.2rem; font-weight:900; color:#ef4444;">&#8377;0.00</div>
                            </div>
                            <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:10px 14px; text-align:center;">
                                <div style="font-size:0.55rem; color:#f59e0b; font-weight:900; letter-spacing:0.1em;">DIRECT</div>
                                <div id="exp-stat-direct" style="font-size:1.2rem; font-weight:900; color:#f59e0b;">&#8377;0.00</div>
                            </div>
                            <div style="background:rgba(168,85,247,0.08); border:1px solid rgba(168,85,247,0.2); border-radius:10px; padding:10px 14px; text-align:center;">
                                <div style="font-size:0.55rem; color:#a855f7; font-weight:900; letter-spacing:0.1em;">INDIRECT</div>
                                <div id="exp-stat-indirect" style="font-size:1.2rem; font-weight:900; color:#a855f7;">&#8377;0.00</div>
                            </div>
                        </div>

                        <!-- Expense Table -->
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
                                <thead>
                                    <tr style="border-bottom:2px solid var(--glass-border);">
                                        <th style="padding:8px 10px; text-align:left; color:#ef4444; font-size:0.6rem; letter-spacing:0.08em;">REF NO</th>
                                        <th style="padding:8px 10px; text-align:left; color:var(--text-muted); font-size:0.6rem;">DATE</th>
                                        <th style="padding:8px 10px; text-align:left; color:var(--text-muted); font-size:0.6rem;">TYPE</th>
                                        <th style="padding:8px 10px; text-align:left; color:var(--text-muted); font-size:0.6rem;">HEAD</th>
                                        <th style="padding:8px 10px; text-align:left; color:var(--text-muted); font-size:0.6rem;">NARRATION</th>
                                        <th style="padding:8px 10px; text-align:left; color:var(--text-muted); font-size:0.6rem;">MODE</th>
                                        <th style="padding:8px 10px; text-align:right; color:#ef4444; font-size:0.6rem;">AMOUNT (&#8377;)</th>
                                        <th style="padding:8px 10px; text-align:center; color:var(--text-muted); font-size:0.6rem;">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody id="expense-register-body">
                                    <tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading expenses...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>`;
                    
const before = lines.slice(0, 1367).join('\n');
const after = lines.slice(1395).join('\n');
html = before + '\n' + newCard + '\n' + after;

// Add edit modal at the end, before <audio id="bgMusic">
const editModal = `
    <!-- MODAL: Edit Expense -->
    <div id="editExpenseModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 5000; padding: 1rem;">
        <div class="glass-card" style="width: min(95vw, 650px); margin: 0; border-top: 5px solid #f59e0b; padding: 0; overflow: hidden; border-radius: 20px;">
            <div style="background:rgba(255,255,255,0.03); padding:1rem 1.5rem; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:0.5rem; font-weight:900; letter-spacing:0.15em; color:#f59e0b; margin-bottom:2px;">EXPENSE CORRECTION</div>
                    <h2 style="font-size:1.1rem; font-weight:900; color:#fff; margin:0;">&#9998; Edit Expense Entry</h2>
                </div>
                <div style="font-size:0.75rem; color:#f59e0b; font-weight:900;" id="edit-exp-refno"></div>
                <button type="button" class="btn btn-ghost" onclick="document.getElementById('editExpenseModal').classList.add('hidden')" style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:1rem;cursor:pointer;">&#10005;</button>
            </div>
            <form id="editExpenseForm" onsubmit="updateExpense(event)" style="padding:1.5rem;">
                <input type="hidden" id="edit-exp-id">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
                    <div>
                        <label style="font-size:0.6rem; font-weight:800; color:#f59e0b; display:block; margin-bottom:4px;">DATE</label>
                        <input type="date" id="edit-exp-date" required style="width:100%; padding:9px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff;">
                    </div>
                    <div>
                        <label style="font-size:0.6rem; font-weight:800; color:#f59e0b; display:block; margin-bottom:4px;">EXPENSE TYPE</label>
                        <select id="edit-exp-type" required onchange="loadEditExpenseCategoryOptions()" style="width:100%; padding:9px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff;">
                            <option value="Direct">Direct</option>
                            <option value="Indirect">Indirect</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.6rem; font-weight:800; color:#f59e0b; display:block; margin-bottom:4px;">EXPENSE HEAD</label>
                        <select id="edit-exp-category" required style="width:100%; padding:9px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff;"></select>
                    </div>
                    <div>
                        <label style="font-size:0.6rem; font-weight:800; color:#f59e0b; display:block; margin-bottom:4px;">PAYMENT MODE</label>
                        <select id="edit-exp-method" style="width:100%; padding:9px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff;">
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI / GPay</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="font-size:0.6rem; font-weight:800; display:block; margin-bottom:4px;">NARRATION / DESCRIPTION</label>
                    <input type="text" id="edit-exp-title" required style="width:100%; padding:9px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="font-size:0.6rem; font-weight:800; color:#ef4444; display:block; margin-bottom:4px;">AMOUNT (&#8377;)</label>
                    <input type="number" id="edit-exp-amount" required step="0.01" style="width:100%; padding:12px; font-size:1.2rem; font-weight:900; color:#ef4444; background:rgba(239,68,68,0.05); border:2px solid #ef4444; border-radius:8px; text-align:right; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label style="font-size:0.6rem; font-weight:800; display:block; margin-bottom:4px;">NOTES</label>
                    <input type="text" id="edit-exp-notes" placeholder="Optional..." style="width:100%; padding:9px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; box-sizing:border-box;">
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid var(--glass-border); padding-top:1rem;">
                    <button type="button" onclick="deleteExpense(document.getElementById('edit-exp-id').value)" style="padding:9px 20px; background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#ef4444; border-radius:8px; cursor:pointer; font-weight:700; font-size:0.8rem;">&#128465; DELETE</button>
                    <div style="display:flex; gap:0.75rem;">
                        <button type="button" class="btn btn-ghost" onclick="document.getElementById('editExpenseModal').classList.add('hidden')" style="padding:9px 20px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:#fff; border-radius:8px; cursor:pointer; font-size:0.8rem;">CANCEL</button>
                        <button type="submit" style="padding:9px 24px; background:linear-gradient(135deg,#f59e0b,#ef4444); border:none; color:#fff; border-radius:8px; cursor:pointer; font-weight:900; font-size:0.8rem;">&#10003; SAVE CHANGES</button>
                    </div>
                </div>
            </form>
        </div>
    </div>`;

html = html.replace('    <audio id="bgMusic"', editModal + '\n    <audio id="bgMusic"');

fs.writeFileSync(path, html);
console.log('SUCCESS: HTML replaced correctly!');
