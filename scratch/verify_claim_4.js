const db = require('../models');

async function check() {
    try {
        const claim = await db.PDCNClaim.findByPk(4, {
            include: [{ model: db.PDCNClaimItem, as: 'items' }]
        });
        
        if (!claim) {
            console.log("PDCN Claim #4 not found.");
        } else {
            console.log("Claim Status:", claim.status);
            console.log("Claim Note No:", claim.creditNoteNo);
        }

        const notes = await db.FinancialNote.findAll({
            where: { reason: 'Price Diff CN' },
            order: [['createdAt', 'DESC']]
        });
        console.log("All PDCN Financial Notes:");
        notes.forEach(n => console.log(`- ${n.noteNo} (Date: ${n.createdAt})`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
