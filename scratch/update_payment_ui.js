const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(filePath, 'utf8');

// Update paymentForm styling
html = html.replace(
    /<form id="paymentForm" onsubmit="savePayment\(event\)" style="flex: 2; padding: 2rem; border-right: 1px solid var\(--glass-border\); overflow-y: auto; margin: 0; background: rgba\(0,0,0,0.1\);">/,
    '<form id="paymentForm" onsubmit="savePayment(event)" style="flex: 1; padding: 2rem; overflow-y: auto; margin: 0; background: rgba(0,0,0,0.1);">'
);

// Replace the bill-adjustment-section
const oldBillAdjustment = /<div id="bill-adjustment-section"[\s\S]*?<\/div>\s*<\/div>\s*<div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">/;
const newBillAdjustment = `<div id="bill-adjustment-section" class="glass-card" style="background: rgba(0,0,0,0.2); border: 1px dashed var(--glass-border); padding: 1.5rem; border-radius: 24px; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.8rem;">
                        <span style="font-size: 0.6rem; font-weight: 900; color: var(--primary); letter-spacing: 1.5px; text-transform: uppercase;">🔄 FIFO ALLOCATION PREVIEW</span>
                        <div id="party-total-due" style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted);">Outstanding: ₹0.00</div>
                    </div>
                    <div id="bill-preview-list" style="flex: 1; max-height: 300px; overflow-y: auto; font-size: 0.85rem; margin-bottom: 1rem;">
                        <div style="text-align: center; color: var(--text-muted); padding: 2rem 1rem; font-style: italic; opacity: 0.5;">
                            Select a party to see and link pending invoices...
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem;">
                        <button type="button" class="btn btn-ghost" onclick="autoAllocatePayment()" style="font-size: 0.75rem; font-weight: 900; letter-spacing: 1px; color: var(--primary); background: rgba(99, 102, 241, 0.1);">⚡ AUTO-ALLOCATE (FIFO)</button>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">UNALLOCATED AMOUNT:</span>
                            <span id="unallocated-amount" style="font-size: 1.1rem; font-weight: 900; color: #ef4444;">₹0.00</span>
                            <span id="linked-total-badge" style="background: rgba(16,185,129,0.1); color: #10b981; font-size: 0.75rem; font-weight: 900; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(16,185,129,0.2); margin-left: 1rem;">LINKED: ₹0.00</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">`;

html = html.replace(oldBillAdjustment, newBillAdjustment);

// Remove the sidebar completely
const sidebarRegex = /<!-- Bill-wise Allocation Sidebar -->[\s\S]*?<\/form>\s*<!-- Bill-wise Allocation Sidebar -->[\s\S]*?<div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var\(--glass-border\);">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

// Wait, the structure is:
// </form>
// <!-- Bill-wise Allocation Sidebar -->
// ...
// </div>
// </div>
// </div>

const startIdx = html.indexOf('<!-- Bill-wise Allocation Sidebar -->');
if (startIdx !== -1) {
    const endFormIdx = html.lastIndexOf('</form>', startIdx);
    
    // Actually, I can just replace everything from <!-- Bill-wise Allocation Sidebar --> to the end of that flex container
    const sidebarEndStr = 'AUTO-ALLOCATE (FIFO)</button>\n                    </div>\n                </div>';
    const endIdx = html.indexOf(sidebarEndStr, startIdx);
    if (endIdx !== -1) {
        html = html.substring(0, startIdx) + html.substring(endIdx + sidebarEndStr.length);
    }
}

// Ensure the width of customer name is wide enough
html = html.replace(/grid-template-columns: 1fr 130px 130px 130px 180px;/g, 'grid-template-columns: 2fr 130px 130px 130px 180px;');
// Also adjust modal width
html = html.replace(/width: min\(98vw, 1400px\);/g, 'width: min(98vw, 1200px);'); // a bit narrower since sidebar is gone

fs.writeFileSync(filePath, html);
console.log('admin.html updated successfully');
