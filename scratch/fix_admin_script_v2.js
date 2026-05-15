const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix loadExpenseCategoryOptions
const oldLoadExp = /async function loadExpenseCategoryOptions\(\) \{[\s\S]*?\n\}/;
const newLoadExp = `async function loadExpenseCategoryOptions() {
    const catSelect = document.getElementById('exp-category');
    catSelect.innerHTML = '<option value="">Loading...</option>';

    // Fetch fresh categories from database
    await fetchExpenseCategories();

    // Show ALL categories (Direct and Indirect)
    const direct = EXPENSE_CATEGORIES_CACHE.Direct || [];
    const indirect = EXPENSE_CATEGORIES_CACHE.Indirect || [];
    
    catSelect.innerHTML = '<option value="">-- Select Head --</option>';
    
    if (direct.length > 0) {
        catSelect.innerHTML += '<optgroup label="DIRECT EXPENSES">';
        direct.forEach(c => catSelect.innerHTML += \`<option value="\${c}">\${c}</option>\`);
        catSelect.innerHTML += '</optgroup>';
    }
    
    if (indirect.length > 0) {
        catSelect.innerHTML += '<optgroup label="INDIRECT EXPENSES">';
        indirect.forEach(c => catSelect.innerHTML += \`<option value="\${c}">\${c}</option>\`);
        catSelect.innerHTML += '</optgroup>';
    }

    if (direct.length === 0 && indirect.length === 0) {
        catSelect.innerHTML += '<option disabled>No categories found. Add in Global Masters.</option>';
    }
}`;

content = content.replace(oldLoadExp, newLoadExp);

// 2. Fix openExpenseModal
const oldOpenExp = /async function openExpenseModal\(\) \{[\s\S]*?\n\}/;
const newOpenExp = `async function openExpenseModal() {
    const modal = document.getElementById('expenseModal');
    modal.classList.remove('hidden');

    // Reset fields
    document.getElementById('expenseForm').reset();
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    
    // Load all categories into the single dropdown
    await loadExpenseCategoryOptions();

    // Auto-fetch next Expense Reference Number
    try {
        const res = await fetch(\`\${API_BASE}/admin/next-doc-no?type=expense\`);
        if (res.ok) {
            const { docNo } = await res.json();
            document.getElementById('exp-ref').value = docNo;
        }
    } catch(e) {
        document.getElementById('exp-ref').value = 'EXP-' + Date.now();
    }
}`;

content = content.replace(oldOpenExp, newOpenExp);

// 3. Fix saveExpense
const oldSaveExp = /async function saveExpense\(e\) \{[\s\S]*?\n\}/;
const newSaveExp = `async function saveExpense(e) {
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

content = content.replace(oldSaveExp, newSaveExp);

// 4. Fix generateReport default dates (Wide range to prevent blank screen)
content = content.replace(/const firstDay = new Date\(today\.getFullYear\(\), today\.getMonth\(\), 1\);/, "const firstDay = new Date('2024-04-01'); // Wide default range");

fs.writeFileSync(path, content);
console.log('Fixed admin-script.js functions');
