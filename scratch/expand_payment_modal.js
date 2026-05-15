const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/admin.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Increase Payment Modal Width
content = content.replace(/id="paymentModal"[\s\S]*?width: 700px;/, (match) => {
    return match.replace('width: 700px;', 'width: min(98vw, 1400px);');
});

// 2. Adjust Grid Columns for better space utilization (Dynamic widths)
content = content.replace(/grid-template-columns: 180px 1fr 130px 130px 130px 150px;/, 'grid-template-columns: 140px 1.5fr 130px 130px 130px 180px;');

fs.writeFileSync(path, content);
console.log('Fixed Payment Modal Width and Space Utilization');
