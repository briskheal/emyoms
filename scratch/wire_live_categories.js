const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let content = fs.readFileSync(path, 'utf8');
const originalLength = content.length;

// === STEP 1: Replace EXPENSE_CATEGORIES block ===
// Find start and end of the const block
const blockStart = content.indexOf('const EXPENSE_CATEGORIES = {');
if (blockStart < 0) { console.error('EXPENSE_CATEGORIES not found!'); process.exit(1); }

// Find end: next occurrence of "};" after the start
const blockEnd = content.indexOf('\n};', blockStart) + 3; // includes \n};

const newBlock = `// Live Expense Category Cache - populated from DB on demand
let EXPENSE_CATEGORIES_CACHE = { Direct: [], Indirect: [] };

async function fetchExpenseCategories() {
    try {
        const res = await fetch('/api/expense-categories');
        const data = await res.json();
        EXPENSE_CATEGORIES_CACHE = { Direct: [], Indirect: [] };
        data.forEach(cat => {
            const type = cat.expenseType || 'Indirect';
            if (!EXPENSE_CATEGORIES_CACHE[type]) EXPENSE_CATEGORIES_CACHE[type] = [];
            EXPENSE_CATEGORIES_CACHE[type].push(cat.name);
        });
        // Populate JV expense-head datalist for autocomplete
        const headList = document.getElementById('expense-head-list');
        if (headList) {
            headList.innerHTML = data.map(c => '<option value="' + c.name + '"></option>').join('');
        }
    } catch(e) {
        console.warn('Could not fetch expense categories from DB:', e);
    }
}`;

content = content.slice(0, blockStart) + newBlock + content.slice(blockEnd);
console.log('Step 1 done. Size change:', content.length - originalLength);

// === STEP 2: Replace loadExpenseCategoryOptions ===
const funcMarker = 'function loadExpenseCategoryOptions() {';
const funcStart = content.indexOf(funcMarker);
if (funcStart < 0) { console.error('loadExpenseCategoryOptions not found!'); process.exit(1); }

// Find closing brace of the function
const funcEnd = content.indexOf('\n}', funcStart) + 2;

const newFunc = `async function loadExpenseCategoryOptions() {
    const type = document.getElementById('exp-type').value;
    const catSelect = document.getElementById('exp-category');
    if (!type) { catSelect.innerHTML = '<option value="">-- Select Type First --</option>'; return; }

    catSelect.innerHTML = '<option value="">Loading...</option>';

    // Always fetch fresh categories from database
    await fetchExpenseCategories();

    const cats = EXPENSE_CATEGORIES_CACHE[type] || [];
    catSelect.innerHTML = '<option value="">-- Select Category --</option>';
    if (cats.length === 0) {
        catSelect.innerHTML += '<option disabled>No categories. Add in Global Masters.</option>';
    } else {
        cats.forEach(c => {
            catSelect.innerHTML += '<option value="' + c + '">' + c + '</option>';
        });
    }
}`;

content = content.slice(0, funcStart) + newFunc + content.slice(funcEnd);
console.log('Step 2 done.');

fs.writeFileSync(path, content);
console.log('FINAL SIZE:', content.length, '| SUCCESS');
