const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin-script.js');
let script = fs.readFileSync(filePath, 'utf8');

const targetStr = `    badge.innerText = type === 'RECEIPT' ? "RECEIPT" : "PAYMENT OUT";
    badge.style.background = type === 'RECEIPT' ? '#10b981' : '#ef4444';
    vPlaceholder.innerText = \`PAY\${type === 'RECEIPT' ? 'IN' : 'OUT'}-\${yearTag}-XXXX\`;`;

const newStr = `    badge.innerText = type === 'RECEIPT' ? "RECEIPT" : "PAYMENT OUT";
    badge.style.background = type === 'RECEIPT' ? '#10b981' : '#ef4444';
    
    // Fetch actual auto-generated doc number
    vPlaceholder.innerText = 'Loading...';
    const docType = type === 'RECEIPT' ? 'payin' : 'payout';
    fetch(\`/api/admin/next-doc-no?type=\${docType}\`)
        .then(res => res.json())
        .then(data => {
            if (data && data.docNo) vPlaceholder.innerText = data.docNo;
            else vPlaceholder.innerText = \`PAY\${type === 'RECEIPT' ? 'IN' : 'OUT'}-\${yearTag}-XXXX\`;
        })
        .catch(e => {
            console.error('Failed to fetch next doc no:', e);
            vPlaceholder.innerText = \`PAY\${type === 'RECEIPT' ? 'IN' : 'OUT'}-\${yearTag}-XXXX\`;
        });`;

if (script.includes(targetStr)) {
    script = script.replace(targetStr, newStr);
    fs.writeFileSync(filePath, script);
    console.log('Successfully updated updatePaymentContext');
} else {
    console.log('Target string not found in admin-script.js');
}
