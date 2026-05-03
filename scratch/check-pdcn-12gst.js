const db = require('../models');

async function checkPDCN() {
    try {
        const items = await db.PDCNClaimItem.findAll({
            where: { gstPercent: 12 }
        });
        console.log(`Found ${items.length} PDCN claim items with 12% GST.`);
        
        const claimIds = [...new Set(items.map(item => item.pdcnClaimId))];
        for (const id of claimIds) {
            console.log(`- PDCN Claim ID: ${id}`);
        }
    } catch (error) {
        console.error('Error checking PDCN:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkPDCN();
