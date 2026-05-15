const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

const insertionPoint = '<!-- EXPENSE MANAGEMENT: Full Grid -->';
const newCard = `
                    <!-- EXPENSE & OVERHEADS -->
                    <div class="glass-card" style="padding: 1.5rem; border-top: 4px solid #f87171;">
                        <h3 class="section-title" style="font-size: 1rem; margin-bottom: 1.5rem;"><span style="opacity: 0.8;">💸</span> Expense & Overheads</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <button class="btn btn-ghost" style="justify-content: flex-start; text-align: left;" onclick="generateReport('expense-transaction')">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.85rem; font-weight: 800; color: #fff;">Detailed Expense Log</span>
                                    <span style="font-size: 0.65rem; color: var(--text-muted);">Itemized list of all operational expenses.</span>
                                </div>
                            </button>
                            <button class="btn btn-ghost" style="justify-content: flex-start; text-align: left;" onclick="generateReport('expense-category')">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.85rem; font-weight: 800; color: #fff;">Category-wise Breakdown</span>
                                    <span style="font-size: 0.65rem; color: var(--text-muted);">Expenses grouped by Head (Direct/Indirect).</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    `;

content = content.replace(insertionPoint, newCard + insertionPoint);

fs.writeFileSync(path, content);
console.log('Added Expense & Overheads card to Intelligence Center');
