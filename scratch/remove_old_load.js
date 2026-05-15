const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let content = fs.readFileSync(path, 'utf8');

// Remove the OLD duplicate loadExpenseCategoryOptions (the sync version that still uses EXPENSE_CATEGORIES)
const oldFunc = `function loadExpenseCategoryOptions() {
    const type = document.getElementById('exp-type').value;
    const catSelect = document.getElementById('exp-category');
    catSelect.innerHTML = '<option value="">-- Select Category --</option>';
    if (!type) return;
    (EXPENSE_CATEGORIES[type] || []).forEach(c => {
        catSelect.innerHTML += \`<option value="\${c}">\${c}</option>\`;
    });
}`;

if (content.includes(oldFunc)) {
    content = content.replace(oldFunc, '// [Removed: now handled by async loadExpenseCategoryOptions below]');
    console.log('Removed old sync version.');
} else {
    // Try CRLF version
    const oldFuncCRLF = oldFunc.replace(/\n/g, '\r\n');
    if (content.includes(oldFuncCRLF)) {
        content = content.replace(oldFuncCRLF, '// [Removed: now handled by async loadExpenseCategoryOptions below]');
        console.log('Removed old CRLF sync version.');
    } else {
        console.log('Old function not found by exact match - checking with indexOf...');
        const marker = 'function loadExpenseCategoryOptions() {\r\n    const type = document.getElementById';
        const idx = content.indexOf(marker);
        if (idx >= 0) {
            const endIdx = content.indexOf('\r\n}\r\n', idx) + 4;
            content = content.slice(0, idx) + '// [Removed: duplicate]' + content.slice(endIdx);
            console.log('Removed via indexOf at:', idx);
        } else {
            console.log('Could not find old function to remove.');
        }
    }
}

fs.writeFileSync(path, content);
console.log('Done.');
