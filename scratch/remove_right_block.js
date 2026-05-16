const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(filePath, 'utf8');

const startIdx = html.indexOf('<!-- Bill-wise Allocation Sidebar -->');
const endStr = 'AUTO-ALLOCATE (FIFO)</button>\n                    </div>\n                </div>\n            </div>';

if (startIdx !== -1) {
    let endIdx = html.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        // Also remove the extra closing div since we are removing a wrapper div above?
        // Wait, what does the structure look like?
        /*
        <div style="display: flex; flex: 1; overflow: hidden;">
            <form id="paymentForm" ...>
               ...
            </form>
            <!-- Bill-wise Allocation Sidebar -->
            <div id="pending-bills-sidebar" ...>
               ...
            </div>
        </div>
        */
        // If we remove the sidebar, we just need to remove from "<!-- Bill-wise Allocation Sidebar -->" to "</div>"
        // Let's just use regex to replace it.
        const replaced = html.replace(/<!-- Bill-wise Allocation Sidebar -->[\s\S]*?<div id="pending-bills-sidebar"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '</div>');
        // Actually, let's just do a simple replacement string
        // Since I see it in `view_file` at line 3256 to 3277 + `</div>` on 3278
        let targetStr = `<!-- Bill-wise Allocation Sidebar -->
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
        html = html.replace(targetStr, '</div>');
        fs.writeFileSync(filePath, html);
        console.log('Successfully removed right side block.');
    }
}
