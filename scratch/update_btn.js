const fs = require('fs');
let c = fs.readFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', 'utf8');

// Update the LOG NEW EXPENSE button to use openExpenseModal()
const old = "onclick=\"document.getElementById('expenseModal').classList.remove('hidden')\"";
const newBtn = 'onclick="openExpenseModal()"';
c = c.replace(old, newBtn);

// Bump version
c = c.replace('admin-script.js?v=2.9', 'admin-script.js?v=3.0');

fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', c);
console.log('Updated. Button replaced:', c.includes('openExpenseModal()'), '| Version 3.0:', c.includes('v=3.0'));
