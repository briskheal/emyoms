const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let html = fs.readFileSync(path, 'utf8');

// 1. Update Modal Width and Layout
const oldModalHeader = `<div id="paymentModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 5000;">
        <div class="glass-card" style="width: 700px; margin: 0; border-top: 5px solid var(--primary); padding: 0; overflow: hidden; border-radius: 24px;">`;

const newModalHeader = `<div id="paymentModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 5000;">
        <div class="glass-card" style="width: 1100px; max-height: 90vh; margin: 0; border-top: 5px solid var(--primary); padding: 0; overflow: hidden; border-radius: 24px; display: flex; flex-direction: column;">`;

html = html.replace(oldModalHeader, newModalHeader);

// 2. Wrap Form and Add Sidebar
const oldFormStart = `<form id="paymentForm" onsubmit="savePayment(event)" style="padding: 2rem;">`;
const newFormStart = `<div style="display: flex; flex: 1; overflow: hidden;">
                <form id="paymentForm" onsubmit="savePayment(event)" style="flex: 1.6; padding: 2rem; border-right: 1px solid var(--glass-border); overflow-y: auto; margin: 0;">`;

html = html.replace(oldFormStart, newFormStart);

const oldFormEnd = `</form>
        </div>
    </div>`;
// This part is tricky because there might be multiple </form></div></div>. 
// I'll look for the end of the paymentForm specifically.

const paymentFormClose = `</form>
        </div>`; // end of glass-card, end of modal background
// Actually, let's look at the structure more carefully.

const sidebarHtml = `
                <!-- Bill-wise Allocation Sidebar -->
                <div id="pending-bills-sidebar" style="flex: 1; padding: 2rem; background: rgba(255,255,255,0.02); overflow-y: auto; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="font-size: 0.9rem; font-weight: 900; color: #fff; margin: 0; display: flex; align-items: center; gap: 8px;">
                            <span style="opacity: 0.6;">📄</span> PENDING BILLS
                        </h3>
                        <span id="linked-total-badge" style="background: rgba(16,185,129,0.1); color: #10b981; font-size: 0.65rem; font-weight: 900; padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(16,185,129,0.2);">LINKED: ₹0.00</span>
                    </div>
                    <div id="pending-bills-list" style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted); font-size: 0.8rem; border: 2px dashed var(--glass-border); border-radius: 20px;">
                            <div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;">📋</div>
                            Select a party to view and link pending invoices.
                        </div>
                    </div>
                    <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--glass-border);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">UNALLOCATED AMOUNT</span>
                            <span id="unallocated-amount" style="font-size: 0.9rem; font-weight: 900; color: #ef4444;">₹0.00</span>
                        </div>
                        <button type="button" class="btn btn-ghost" onclick="autoAllocatePayment()" style="width: 100%; font-size: 0.7rem; font-weight: 900; letter-spacing: 1px; color: var(--primary);">AUTO-ALLOCATE (FIFO)</button>
                    </div>
                </div>
            </div>`;

// Find the end of the form
const formEndIndex = html.indexOf('</form>', html.indexOf('id="paymentForm"'));
if (formEndIndex !== -1) {
    const before = html.substring(0, formEndIndex + 7);
    const after = html.substring(formEndIndex + 7);
    html = before + sidebarHtml + after;
}

fs.writeFileSync(path, html);
console.log("SUCCESS: admin.html updated with Payment Sidebar.");
