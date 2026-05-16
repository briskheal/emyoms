const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove balance update from manual JV creation
const jvBalanceBlock = `            // FINANCIAL INTEGRATION: Update Stockist Balance if applicable
            if (line.entityType === 'Stockist' && line.entityId) {
                const stockist = await db.Stockist.findByPk(line.entityId, { transaction: t });
                if (stockist) {
                    const adj = (line.type === 'DR') ? Number(line.amount) : -Number(line.amount);
                    await stockist.increment('outstandingBalance', { by: adj, transaction: t });
                }
            }`;

if (content.includes(jvBalanceBlock)) {
    content = content.replace(jvBalanceBlock, '            // Removed duplicate balance update from JV logic to prevent double-counting');
    console.log('Removed balance update from manual JV logic');
}

// 2. We also need to check for delete JV logic if it exists
const deleteJvMatch = /app\.delete\('\/api\/admin\/journal-vouchers\/:id'[\s\S]*?\}\);/g;
// I'll check if there's any balance reversal in delete too

fs.writeFileSync(filePath, content);
