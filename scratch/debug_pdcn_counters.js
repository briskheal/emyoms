const db = require('../models');

async function check() {
    try {
        const company = await db.Company.findOne();
        console.log("Document Counters:", JSON.stringify(company.documentCounters, null, 2));

        const lastNote = await db.FinancialNote.findOne({
            where: { reason: 'Price Diff CN' },
            order: [['createdAt', 'DESC']]
        });
        console.log("Last PDCN Note:", lastNote ? lastNote.noteNo : "None");
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
