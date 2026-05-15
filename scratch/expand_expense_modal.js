const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Increase Expense Modal Width
content = content.replace(/id="expenseModal"[\s\S]*?width: min\(98vw, 1200px\);/, (match) => {
    return match.replace('width: min(98vw, 1200px);', 'width: min(98vw, 1500px);');
});

// 2. Adjust Grid Columns for Expense Modal
content = content.replace(/grid-template-columns: 120px 240px 1fr 140px 140px 110px;/, 'grid-template-columns: 120px 240px 1.5fr 140px 140px 140px;');

fs.writeFileSync(path, content);
console.log('Fixed Expense Modal Width and Space Utilization');
