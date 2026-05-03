// Script: Clear all PDCN Claim records for a fresh start
const db = require('../models');

async function clearAllPDCN() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Connected to DB');

        // Delete items first (child records)
        const itemsDeleted = await db.PDCNClaimItem.destroy({ where: {} });
        console.log(`🗑️  Deleted ${itemsDeleted} PDCNClaimItem records`);

        // Delete parent claims
        const claimsDeleted = await db.PDCNClaim.destroy({ where: {} });
        console.log(`🗑️  Deleted ${claimsDeleted} PDCNClaim records`);

        console.log('✅ PDCN records cleared. Ready for fresh submissions.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

clearAllPDCN();
