const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let content = fs.readFileSync(path, 'utf8');

const oldSaveExpense = /async function saveExpense\(e\) \{[\s\S]*?\n\}/;
const newSaveExpense = `async function saveExpense(e) {
    e.preventDefault();
    const btn = e.submitter;
    const originalText = btn.innerHTML;

    const data = {
        categoryName: document.getElementById('exp-category').value,
        title: document.getElementById('exp-title').value,
        date: document.getElementById('exp-date').value,
        amount: Number(document.getElementById('exp-amount').value),
        paymentMethod: document.getElementById('exp-method').value,
        refNo: document.getElementById('exp-ref').value,
        notes: document.getElementById('exp-notes').value
    };

    if (!data.categoryName) return alert('Please select an Expense Head.');
    if (data.amount <= 0) return alert('Amount must be greater than zero.');

    try {
        btn.disabled = true;
        btn.innerHTML = '⏳ POSTING...';

        const res = await fetch(\`\${API_BASE}/admin/expenses\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.success) {
            alert(\`✅ Expense posted successfully!\`);
            document.getElementById('expenseModal').classList.add('hidden');
            loadExpenses();
            document.getElementById('expenseForm').reset();
        } else {
            alert('Error: ' + (result.error || 'Unknown error'));
        }
    } catch (err) {
        console.error(err);
        alert('Server error. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}`;

// The regex above might be too greedy or fail if the trailing brace is not clear.
// I'll try a more specific replacement based on the line fragments I saw.
content = content.replace(/\s*};[\s\S]*?if \(!data\.type\)[\s\S]*?async function generateSampleMatchedPDF/, (match) => {
    return '\n' + newSaveExpense + '\n\nasync function generateSampleMatchedPDF';
});

fs.writeFileSync(path, content);
console.log('Fixed admin-script.js');
