const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add openExpenseModal function before saveExpense
const saveExpenseMarker = 'async function saveExpense(e) {';
const insertIdx = content.indexOf(saveExpenseMarker);
if (insertIdx < 0) { console.error('saveExpense not found!'); process.exit(1); }

const openModalFunc = `async function openExpenseModal() {
    const modal = document.getElementById('expenseModal');
    modal.classList.remove('hidden');

    // Reset fields
    document.getElementById('expenseForm').reset();
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('exp-category').innerHTML = '<option value="">-- Select Type First --</option>';

    // Auto-fetch next Expense Reference Number from backend
    try {
        const res = await fetch(\`\${API_BASE}/admin/next-doc-no?type=expense\`);
        if (res.ok) {
            const { docNo } = await res.json();
            document.getElementById('exp-ref-display').innerText = docNo;
            document.getElementById('exp-ref').value = docNo;
        }
    } catch(e) {
        document.getElementById('exp-ref-display').innerText = 'Auto';
    }
}

`;

content = content.slice(0, insertIdx) + openModalFunc + content.slice(insertIdx);

// 2. Remove refNo from saveExpense data payload (backend assigns it automatically)
content = content.replace(
    '        refNo: document.getElementById(\'exp-ref\').value,\n        notes',
    '        notes'
);

fs.writeFileSync(path, content);
console.log('SUCCESS: openExpenseModal added, refNo removed from payload.');
