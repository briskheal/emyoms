const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

serverCode = serverCode.replace(
    /if \(qtySelections && qtySelections\[item\.id\] !== undefined\) \{/g,
    `const qtyKey = item.id ? String(item.id) : (item._id ? String(item._id) : null);
            if (qtySelections && qtyKey && (qtySelections[qtyKey] !== undefined || qtySelections[item.id] !== undefined)) {`
);

serverCode = serverCode.replace(
    /const newQty = Number\(qtySelections\[item\.id\]\);/g,
    `const newQty = Number(qtySelections[qtyKey] !== undefined ? qtySelections[qtyKey] : qtySelections[item.id]);`
);

serverCode = serverCode.replace(
    /const selectedBatchNo = batchSelections \? batchSelections\[item\.id\] : null;/g,
    `const bKey = item.id ? String(item.id) : (item._id ? String(item._id) : null);
                    const selectedBatchNo = batchSelections ? (batchSelections[bKey] || batchSelections[item.id] || batchSelections[item._id]) : null;`
);

fs.writeFileSync('server.js', serverCode);
console.log('Fixed server.js ID mapping');
