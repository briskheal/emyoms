const fs = require('fs');

let code = fs.readFileSync('server.js', 'utf8');

// Patch 1: /api/stockist/purchased-items/:stockistId map key (purchases)
code = code.replace(
    /const key = `\$\{item\.name\}\|\$\{item\.batch\}`;/g,
    'const key = `${item.productId || item.name}|${item.batch}`;'
);

// Add productId to purchasedMap output
code = code.replace(
    /name: item\.name,\n\s*batch: item\.batch,/g,
    'productId: item.productId,\n                            name: item.name,\n                            batch: item.batch,'
);

// Patch 2: /api/stockist/purchased-items/:stockistId map key (returns)
code = code.replace(
    /const key = `\$\{item\.name\}\|\$\{item\.batchNo\}`;/g,
    'const key = `${item.productId || item.name}|${item.batchNo}`;'
);

// Patch 3: /api/stockist/purchase-return validation loop
code = code.replace(
    /const key = `\$\{item\.name\}\|\$\{item\.batch\}`;/g,
    'const key = `${item.productId || item.name}|${item.batch}`;'
);

// Patch 4: /api/stockist/purchase-return item creation
code = code.replace(
    /const product = await db\.Product\.findOne\(\{ where: \{ name: \{ \[db\.Sequelize\.Op\.iLike\]: item\.name\.trim\(\) \} \} \}\);\s*await db\.NoteItem\.create\(\{/g,
    `// Use frontend productId if available, fallback to name
            const product = item.productId ? await db.Product.findByPk(item.productId) : await db.Product.findOne({ where: { name: { [db.Sequelize.Op.iLike]: item.name.trim() } } });
            
            await db.NoteItem.create({`
);

fs.writeFileSync('server.js', code);
console.log("Patched server.js successfully");
