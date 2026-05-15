const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

// Find the expense modal div by its opening marker
const startMarker = '    <div id="expenseModal" class="hidden"';
const startIdx = content.indexOf(startMarker);
if (startIdx < 0) { console.error('Start marker not found!'); process.exit(1); }

// Find the closing of the modal: two closing divs after the form close
// The pattern is: </form>\n        </div>\n    </div>
const formClose = '</form>\n        </div>\n    </div>';
const formCloseIdx = content.indexOf(formClose, startIdx);
if (formCloseIdx < 0) {
    // Try CRLF
    const formCloseCRLF = '</form>\r\n        </div>\r\n    </div>';
    const crlfIdx = content.indexOf(formCloseCRLF, startIdx);
    if (crlfIdx < 0) {
        console.error('Form close not found!');
        // Print 200 chars around expected area
        console.log('Area around line 3042:', content.slice(content.indexOf('</form>', startIdx) - 20, content.indexOf('</form>', startIdx) + 100));
        process.exit(1);
    }
    const endIdx = crlfIdx + formCloseCRLF.length;
    replaceSection(content, startIdx, endIdx, path);
} else {
    const endIdx = formCloseIdx + formClose.length;
    replaceSection(content, startIdx, endIdx, path);
}

function replaceSection(content, startIdx, endIdx, path) {
    console.log('Replacing from char', startIdx, 'to', endIdx);
    console.log('Old block length:', endIdx - startIdx);

    const newModal = `    <!-- MODAL: Expense Entry (Horizontal Layout) -->
    <div id="expenseModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 4000; padding: 1rem;">
        <div class="glass-card" style="width: min(98vw, 1100px); margin: 0; border-top: 5px solid #ef4444; padding: 0; overflow: hidden; border-radius: 20px;">

            <!-- Header -->
            <div style="background: rgba(255,255,255,0.03); padding: 1rem 1.5rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div>
                        <div style="font-size:0.5rem; font-weight:900; letter-spacing:0.15em; text-transform:uppercase; color:#ef4444; margin-bottom:2px;">EXPENSE MANAGEMENT</div>
                        <h2 style="font-size:1.1rem; font-weight:900; color:#fff; margin:0;">&#128184; Log New Expense</h2>
                    </div>
                    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 4px 12px;">
                        <div style="font-size:0.55rem; color:var(--text-muted);">REF NO (AUTO)</div>
                        <div id="exp-ref-display" style="font-size:0.85rem; font-weight:900; color:#ef4444; letter-spacing:1px;">Loading...</div>
                    </div>
                </div>
                <button type="button" class="btn btn-ghost" onclick="document.getElementById('expenseModal').classList.add('hidden')" style="width:36px; height:36px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); font-size:1rem;" onmouseover="this.style.background='rgba(239,68,68,0.3)'; this.style.color='#ef4444';" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.color='#fff';">&#10005;</button>
            </div>

            <form id="expenseForm" onsubmit="saveExpense(event)" style="padding: 1.25rem 1.5rem;">

                <!-- HORIZONTAL ENTRY ROW -->
                <div style="display: grid; grid-template-columns: 110px 115px 185px 1fr 130px 140px 110px; gap: 0.75rem; align-items: end; margin-bottom: 0.75rem;">

                    <div>
                        <label style="font-size:0.6rem; font-weight:800; color:#ef4444; display:block; margin-bottom:4px;">DATE</label>
                        <input type="date" id="exp-date" required style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                    </div>

                    <div>
                        <label style="font-size:0.6rem; font-weight:800; color:#ef4444; display:block; margin-bottom:4px;">TYPE</label>
                        <select id="exp-type" required onchange="loadExpenseCategoryOptions()" style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                            <option value="">-- Type --</option>
                            <option value="Direct">Direct</option>
                            <option value="Indirect">Indirect</option>
                        </select>
                    </div>

                    <div>
                        <label style="font-size:0.6rem; font-weight:800; color:#ef4444; display:block; margin-bottom:4px;">EXPENSE HEAD</label>
                        <select id="exp-category" required style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                            <option value="">-- Select Type First --</option>
                        </select>
                    </div>

                    <div>
                        <label style="font-size:0.6rem; font-weight:800; display:block; margin-bottom:4px;">NARRATION / DESCRIPTION</label>
                        <input type="text" id="exp-title" required placeholder="e.g. Office Rent April 2026, Salary - Ramesh Kumar..." style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                    </div>

                    <div>
                        <label style="font-size:0.6rem; font-weight:800; color:#ef4444; display:block; margin-bottom:4px;">AMOUNT (&#8377;)</label>
                        <input type="number" id="exp-amount" required step="0.01" placeholder="0.00" style="width:100%; padding:8px; font-size:1rem; font-weight:900; color:#ef4444; background:rgba(239,68,68,0.05); border:2px solid #ef4444; border-radius:8px; text-align:right;">
                    </div>

                    <div>
                        <label style="font-size:0.6rem; font-weight:800; display:block; margin-bottom:4px;">PAYMENT MODE</label>
                        <select id="exp-method" style="width:100%; padding:8px; background:rgba(0,0,0,0.4); border:1.5px solid var(--glass-border); border-radius:8px; color:#fff; font-size:0.78rem;">
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI / GPay</option>
                            <option value="Cheque">Cheque</option>
                        </select>
                    </div>

                    <div>
                        <label style="font-size:0.6rem; color: transparent; display:block; margin-bottom:4px;">-</label>
                        <button type="submit" id="save-expense-btn" class="btn btn-primary" style="width:100%; background: linear-gradient(135deg,#ef4444,#f97316); border:none; padding:9px 8px; font-weight:900; font-size:0.8rem; border-radius:8px;">
                            &#128184; POST
                        </button>
                    </div>
                </div>

                <!-- Optional Notes inline -->
                <div style="border-top: 1px solid var(--glass-border); padding-top: 0.75rem; display: flex; align-items: center; gap: 1rem;">
                    <label style="font-size:0.6rem; font-weight:800; color:var(--text-muted); white-space: nowrap;">NOTES (Optional):</label>
                    <input type="text" id="exp-notes" placeholder="Any additional details or remarks..." style="flex:1; padding:6px 10px; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:6px; color:#fff; font-size:0.75rem;">
                    <button type="button" class="btn btn-ghost" onclick="document.getElementById('expenseModal').classList.add('hidden')" style="padding: 6px 16px; font-size:0.75rem; color: var(--text-muted); white-space:nowrap;">CANCEL</button>
                </div>
                <input type="hidden" id="exp-ref">
            </form>
        </div>
    </div>`;

    const result = content.slice(0, startIdx) + newModal + content.slice(endIdx);
    fs.writeFileSync(path, result);
    console.log('SUCCESS! New modal length:', newModal.length, '| File size:', result.length);
}
