const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin-script.js';
let js = fs.readFileSync(path, 'utf8');

// 1. After saveExpense closes modal, also refresh the expense register
const oldSuccess = `document.getElementById('expenseModal').classList.add('hidden');`;
const newSuccess = `document.getElementById('expenseModal').classList.add('hidden');
                loadExpenses();`;
js = js.replace(oldSuccess, newSuccess);

// 2. Wire loadExpenses into DOMContentLoaded (just append)
const appendCall = `\n// Auto-load expense register\ndocument.addEventListener('DOMContentLoaded', () => { loadExpenses(); });\n`;
js += appendCall;

fs.writeFileSync(path, js);
console.log('Done. saveExpense refresh hooked:', js.includes('loadExpenses();'));
