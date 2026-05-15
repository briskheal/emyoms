const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';

const expenseGridJS = `

// =============================================
// EXPENSE REGISTER (List, Edit, Delete)
// =============================================

let allExpenses = [];
let expensesFiltered = [];

async function loadExpenses() {
    try {
        const res = await fetch('/api/admin/expenses');
        allExpenses = await res.json();
        filterExpenses();
    } catch(e) { console.error('Load expenses failed', e); }
}

function filterExpenses() {
    const search  = (document.getElementById('exp-search')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('exp-filter-type')?.value || '';

    expensesFiltered = allExpenses.filter(e => {
        const matchType   = !typeFilter || e.type === typeFilter;
        const matchSearch = !search || 
            (e.categoryName || '').toLowerCase().includes(search) ||
            (e.title || '').toLowerCase().includes(search) ||
            (e.expenseNo || '').toLowerCase().includes(search) ||
            (e.paymentMethod || '').toLowerCase().includes(search);
        return matchType && matchSearch;
    });

    renderExpenseRegister();
}

function renderExpenseRegister() {
    const tbody = document.getElementById('expense-register-body');
    if (!tbody) return;

    // Compute stats
    const total    = expensesFiltered.reduce((s, e) => s + Number(e.amount || 0), 0);
    const direct   = expensesFiltered.filter(e => e.type === 'Direct').reduce((s, e) => s + Number(e.amount || 0), 0);
    const indirect = expensesFiltered.filter(e => e.type === 'Indirect').reduce((s, e) => s + Number(e.amount || 0), 0);

    const fmt = v => '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const el = id => document.getElementById(id);
    if (el('exp-stat-total'))   el('exp-stat-total').innerText   = fmt(total);
    if (el('exp-stat-direct'))  el('exp-stat-direct').innerText  = fmt(direct);
    if (el('exp-stat-indirect'))el('exp-stat-indirect').innerText = fmt(indirect);

    if (!expensesFiltered.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">No expenses found.</td></tr>';
        return;
    }

    tbody.innerHTML = expensesFiltered
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        .map(e => {
            const typeBadge = e.type === 'Direct'
                ? '<span style="background:rgba(245,158,11,0.15);color:#f59e0b;padding:2px 7px;border-radius:4px;font-size:0.6rem;font-weight:900;">DIRECT</span>'
                : '<span style="background:rgba(168,85,247,0.15);color:#a855f7;padding:2px 7px;border-radius:4px;font-size:0.6rem;font-weight:900;">INDIRECT</span>';

            return \`<tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                <td style="padding:8px 10px; color:#ef4444; font-weight:800; font-size:0.75rem;">\${e.expenseNo || '-'}</td>
                <td style="padding:8px 10px; color:var(--text-muted); font-size:0.72rem;">\${e.date ? new Date(e.date).toLocaleDateString('en-IN') : new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                <td style="padding:8px 10px;">\${typeBadge}</td>
                <td style="padding:8px 10px; color:#fff; font-weight:600; font-size:0.75rem;">\${e.categoryName || '-'}</td>
                <td style="padding:8px 10px; color:var(--text-muted); font-size:0.72rem; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="\${e.title || ''}">\${e.title || '-'}</td>
                <td style="padding:8px 10px; color:var(--text-muted); font-size:0.72rem;">\${e.paymentMethod || '-'}</td>
                <td style="padding:8px 10px; text-align:right; color:#ef4444; font-weight:900; font-size:0.85rem;">\${fmt(e.amount)}</td>
                <td style="padding:8px 10px; text-align:center;">
                    <button onclick="openEditExpense(\${e.id})" class="btn btn-ghost" style="padding:3px 10px; font-size:0.65rem; border:1px solid rgba(245,158,11,0.4); color:#f59e0b; border-radius:6px;">&#9998; Edit</button>
                </td>
            </tr>\`;
        }).join('');
}

function openEditExpense(id) {
    const e = allExpenses.find(x => x.id === id);
    if (!e) return;

    document.getElementById('edit-exp-id').value      = e.id;
    document.getElementById('edit-exp-refno').innerText = e.expenseNo || '';
    document.getElementById('edit-exp-date').value    = e.date ? e.date.split('T')[0] : '';
    document.getElementById('edit-exp-type').value    = e.type || 'Indirect';
    document.getElementById('edit-exp-title').value   = e.title || '';
    document.getElementById('edit-exp-amount').value  = e.amount || '';
    document.getElementById('edit-exp-method').value  = e.paymentMethod || 'Cash';
    document.getElementById('edit-exp-notes').value   = e.notes || '';

    loadEditExpenseCategoryOptions(e.categoryName);
    document.getElementById('editExpenseModal').classList.remove('hidden');
}

async function loadEditExpenseCategoryOptions(selectValue) {
    const type = document.getElementById('edit-exp-type').value;
    await fetchExpenseCategories();
    const cats = EXPENSE_CATEGORIES_CACHE[type] || [];
    const catSelect = document.getElementById('edit-exp-category');
    catSelect.innerHTML = cats.map(c => '<option value="' + c + '"' + (c === selectValue ? ' selected' : '') + '>' + c + '</option>').join('');
}

async function updateExpense(e) {
    e.preventDefault();
    const id = document.getElementById('edit-exp-id').value;

    const payload = {
        date:          document.getElementById('edit-exp-date').value,
        type:          document.getElementById('edit-exp-type').value,
        categoryName:  document.getElementById('edit-exp-category').value,
        title:         document.getElementById('edit-exp-title').value,
        amount:        Number(document.getElementById('edit-exp-amount').value),
        paymentMethod: document.getElementById('edit-exp-method').value,
        notes:         document.getElementById('edit-exp-notes').value
    };

    try {
        const res = await fetch('/api/admin/expenses/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('editExpenseModal').classList.add('hidden');
            await loadExpenses();
        } else { alert(data.error || 'Update failed'); }
    } catch(err) { alert(err.message); }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to DELETE this expense? This cannot be undone.')) return;
    try {
        const res = await fetch('/api/admin/expenses/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            document.getElementById('editExpenseModal').classList.add('hidden');
            await loadExpenses();
        } else { alert(data.error || 'Delete failed'); }
    } catch(err) { alert(err.message); }
}

// Hook into saveExpense to refresh the grid after saving
const _origSaveExpense = saveExpense;
`;

fs.appendFileSync(path, expenseGridJS);

// Bump version in admin.html
let html = fs.readFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', 'utf8');
html = html.replace('admin-script.js?v=3.1', 'admin-script.js?v=3.2');
fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', html);

console.log('SUCCESS: Expense grid JS appended. Version bumped to v3.2.');
