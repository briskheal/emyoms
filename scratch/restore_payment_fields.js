const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

// The botched grid replacement:
// <div style="display: grid; grid-template-columns: 1fr 130px 130px 130px 180px; gap: 1rem; align-items: end;">
//     <div style="display: none;">...</div>
//     <div>...SELECT STOCKIST / CUSTOMER...</div>
// </div>

const correctGrid = `
                <!-- ULTRA-DENSE HORIZONTAL VOUCHER BAR -->
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); margin-bottom: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 130px 130px 130px 180px; gap: 1rem; align-items: end;">
                        <div style="display: none;">
                            <label style="font-size: 0.55rem; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 4px; display: block;">1. Type</label>
                            <select id="pay-type" required onchange="updatePaymentContext()" style="font-size: 0.8rem; padding: 8px; background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                                <option value="RECEIPT">RECEIPT (In)</option>
                                <option value="PAYMENT">PAYMENT (Out)</option>
                            </select>
                        </div>
                        <div>
                            <label id="pay-party-label" style="font-size: 0.6rem; font-weight: 900; color: var(--primary); text-transform: uppercase; margin-bottom: 4px; display: block;">1. SELECT STOCKIST / CUSTOMER</label>
                            <select id="pay-party" required onchange="updatePartyBalanceDisplay()" style="font-size: 0.85rem; font-weight: 800; padding: 10px; background: rgba(0,0,0,0.4); border: 1.5px solid var(--primary); border-radius: 8px; color: #fff; width: 100%;">
                                <option value="">-- Search Party --</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.55rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">2. Date</label>
                            <input type="date" id="pay-date" required style="font-size: 0.8rem; padding: 8px; background: transparent; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                        </div>
                        <div>
                            <label style="font-size: 0.55rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">3. Method</label>
                            <select id="pay-method" required style="font-size: 0.8rem; padding: 8px; background: transparent; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="UPI">UPI / GPay</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Adjustment">Adjustment</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 0.55rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; display: block;">4. Ref No</label>
                            <input type="text" id="pay-ref" placeholder="Ref ID" style="font-size: 0.8rem; padding: 8px; background: transparent; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; width: 100%;">
                        </div>
                        <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 6px;">
                            <label style="font-size: 0.55rem; font-weight: 900; color: #ef4444; text-transform: uppercase; margin-bottom: 2px; display: block; text-align: center;">PAYMENT AMOUNT (₹)</label>
                            <input type="number" id="pay-amount" required step="0.01" oninput="previewBillAdjustment()" placeholder="0.00" style="font-size: 1.1rem; font-weight: 950; color: #ef4444; background: transparent; border: none; width: 100%; text-align: center; outline: none;">
                        </div>
                    </div>
                </div>`;

content = content.replace(/<!-- ULTRA-DENSE HORIZONTAL VOUCHER BAR -->[\s\S]*?<\/div>\s*<\/div>/, correctGrid);

fs.writeFileSync(path, content);
console.log('Restored missing Payment fields and fixed the botched UI replacement');
