const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

// --- 1. REPAIR PAYMENT MODAL ---
const paymentFormRegex = /<form id="paymentForm"[\s\S]*?<\/form>/;
const newPaymentForm = `
                <form id="paymentForm" onsubmit="savePayment(event)" style="flex: 2; padding: 2rem; border-right: 1px solid var(--glass-border); overflow-y: auto; margin: 0; background: rgba(0,0,0,0.1);">
                <input type="hidden" id="pay-id">
                
                <!-- ULTRA-DENSE HORIZONTAL VOUCHER BAR -->
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); margin-bottom: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 180px 1fr 130px 130px 130px 150px; gap: 0.75rem; align-items: end;">
                        <div>
                            <label style="font-size: 0.55rem; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 4px; display: block;">1. Type</label>
                            <select id="pay-type" required onchange="updatePaymentContext()" style="font-size: 0.8rem; padding: 8px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                                <option value="RECEIPT">RECEIPT (In)</option>
                                <option value="PAYMENT">PAYMENT (Out)</option>
                            </select>
                        </div>
                        <div>
                            <label id="pay-party-label" style="font-size: 0.55rem; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 4px; display: block;">2. Party / Account</label>
                            <select id="pay-party" required onchange="updatePartyBalanceDisplay()" style="font-size: 0.8rem; padding: 8px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                                <option value="">-- Choose Party --</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.55rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">Date</label>
                            <input type="date" id="pay-date" required style="font-size: 0.8rem; padding: 8px; background: transparent; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 0.55rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">Method</label>
                            <select id="pay-method" required style="font-size: 0.8rem; padding: 8px; background: transparent; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="UPI">UPI / GPay</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Adjustment">Adjustment</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.55rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">Ref No</label>
                            <input type="text" id="pay-ref" placeholder="Ref ID" style="font-size: 0.8rem; padding: 8px; background: transparent; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 0.55rem; font-weight: 900; color: #ef4444; text-transform: uppercase; margin-bottom: 4px; display: block;">Amount (&#8377;)</label>
                            <input type="number" id="pay-amount" required step="0.01" oninput="previewBillAdjustment()" placeholder="0.00" style="font-size: 1rem; font-weight: 900; padding: 8px; background: rgba(239,68,68,0.1); border: 2px solid #ef4444; border-radius: 6px; color: #ef4444; width: 100%; text-align: right;">
                        </div>
                    </div>
                </div>

                <div id="bill-adjustment-section" class="glass-card" style="background: rgba(0,0,0,0.2); border: 1px dashed var(--glass-border); padding: 1.5rem; border-radius: 24px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.8rem;">
                        <span style="font-size: 0.6rem; font-weight: 900; color: var(--primary); letter-spacing: 1.5px; text-transform: uppercase;">🔄 FIFO ALLOCATION PREVIEW</span>
                        <div id="party-total-due" style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">Outstanding: ₹0.00</div>
                    </div>
                    <div id="bill-preview-list" style="flex: 1; max-height: 300px; overflow-y: auto; font-size: 0.85rem;">
                        <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem; font-style: italic; opacity: 0.5;">
                            Select a party to see and link pending invoices...
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
                    <button type="button" class="btn btn-ghost" onclick="closePaymentModal()" style="font-weight: 900; padding: 10px 30px;">✕ DISCARD</button>
                    <button type="submit" id="pay-submit-btn" class="btn btn-primary" style="padding: 10px 50px; font-weight: 950; font-size: 1rem; background: var(--grad-primary); border: none;">
                        ✓ CONFIRM & POST
                    </button>
                </div>
                </form>`;

content = content.replace(paymentFormRegex, newPaymentForm);

// --- 2. REPAIR EXPENSE MODAL ---
const expenseModalRegex = /<!-- MODAL: Expense Entry [\s\S]*?<div id="expenseModal"[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;
const newExpenseModal = `<!-- MODAL: Expense Entry (High-Density Horizontal) -->
    <div id="expenseModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 4000; padding: 1rem;">
        <div class="glass-card" style="width: min(98vw, 1200px); margin: 0; border-top: 5px solid #ef4444; padding: 0; overflow: hidden; border-radius: 20px;">
            <div style="background: rgba(255,255,255,0.03); padding: 1rem 1.5rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size:0.5rem; font-weight:900; letter-spacing:0.15em; text-transform:uppercase; color:#ef4444; margin-bottom:2px;">FINANCIAL CONTROL</div>
                    <h2 style="font-size:1.1rem; font-weight:900; color:#fff; margin:0;">&#128184; Log New Expense</h2>
                </div>
                <button type="button" class="btn btn-ghost" onclick="document.getElementById('expenseModal').classList.add('hidden')" style="width:36px; height:36px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); font-size:1rem;">&#10005;</button>
            </div>
            <form id="expenseForm" onsubmit="saveExpense(event)" style="padding: 1.5rem;">
                <div style="display: grid; grid-template-columns: 120px 240px 1fr 140px 140px 110px; gap: 0.75rem; align-items: end; margin-bottom: 1rem;">
                    <div>
                        <label style="font-size:0.55rem; font-weight:800; color:var(--primary); display:block; margin-bottom:4px;">DATE</label>
                        <input type="date" id="exp-date" required style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                    </div>
                    <div>
                        <label style="font-size:0.55rem; font-weight:800; color:var(--primary); display:block; margin-bottom:4px;">EXPENSE HEAD (CATEGORY)</label>
                        <select id="exp-category" required style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.8rem; font-weight:700;">
                            <option value="">-- Choose Head --</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.55rem; font-weight:800; display:block; margin-bottom:4px; color:var(--text-muted);">DESCRIPTION / NARRATION</label>
                        <input type="text" id="exp-title" required placeholder="e.g. Shop Rent, Electricity, Staff Tea..." style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.8rem;">
                    </div>
                    <div>
                        <label style="font-size:0.55rem; font-weight:800; display:block; margin-bottom:4px; color:var(--text-muted);">PAYMENT MODE</label>
                        <select id="exp-method" style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI / GPay</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-size:0.55rem; font-weight:900; color:#ef4444; display:block; margin-bottom:4px;">AMOUNT (&#8377;)</label>
                        <input type="number" id="exp-amount" required step="0.01" placeholder="0.00" style="width:100%; padding:8px; font-size:1.1rem; font-weight:900; color:#ef4444; background:rgba(239,68,68,0.05); border:2.5px solid #ef4444; border-radius:8px; text-align:right;">
                    </div>
                    <div>
                        <button type="submit" id="save-expense-btn" class="btn btn-primary" style="width:100%; background: linear-gradient(135deg,#ef4444,#f97316); border:none; padding:10px 8px; font-weight:900; font-size:0.85rem; border-radius:8px;">
                            &#128184; POST
                        </button>
                    </div>
                </div>
                <div style="border-top: 1px solid var(--glass-border); padding-top: 1rem; display: flex; align-items: center; gap: 1rem;">
                    <label style="font-size:0.6rem; font-weight:800; color:var(--text-muted); white-space: nowrap;">NOTES / REF:</label>
                    <input type="text" id="exp-notes" placeholder="Optional reference info..." style="flex:1; padding:6px 12px; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-size:0.75rem;">
                    <button type="button" class="btn btn-ghost" onclick="document.getElementById('expenseModal').classList.add('hidden')" style="padding: 6px 20px; font-size:0.75rem; color: var(--text-muted);">CANCEL</button>
                </div>
                <input type="hidden" id="exp-ref">
                <input type="hidden" id="exp-type">
            </form>
        </div>
    </div>`;

content = content.replace(expenseModalRegex, newExpenseModal);

fs.writeFileSync(path, content);
console.log('Fixed admin.html');
