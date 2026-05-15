const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Type field (hide it) and adjust grid
content = content.replace(/<div style="display: grid; grid-template-columns: 140px 1.5fr 130px 130px 130px 180px; gap: 0.75rem; align-items: end;">[\s\S]*?<\/div>\s*<\/div>/, (match) => {
    return `<div style="display: grid; grid-template-columns: 1fr 130px 130px 130px 180px; gap: 1rem; align-items: end;">
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
                        </div>`;
});

// 2. Fix Amount Button/Field overflow - Wrap it in a proper container
content = content.replace(/<div>\s*<label style="font-size: 0.55rem; font-weight: 900; color: #ef4444; text-transform: uppercase; margin-bottom: 4px; display: block;">Amount \(₹\)<\/label>\s*<input type="number" id="pay-amount"[\s\S]*?<\/div>/, (match) => {
    return `<div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 6px;">
                            <label style="font-size: 0.55rem; font-weight: 900; color: #ef4444; text-transform: uppercase; margin-bottom: 2px; display: block; text-align: center;">PAYMENT AMOUNT (₹)</label>
                            <input type="number" id="pay-amount" required step="0.01" oninput="previewBillAdjustment()" placeholder="0.00" style="font-size: 1.1rem; font-weight: 950; color: #ef4444; background: transparent; border: none; width: 100%; text-align: center; outline: none;">
                        </div>`;
});

fs.writeFileSync(path, content);
console.log('Fixed Payment Modal UI issues');
