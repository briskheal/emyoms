const db = require('../models');

async function fix() {
    try {
        const company = await db.Company.findOne();
        if (!company) {
            console.log("No company found.");
            process.exit(1);
        }

        const counters = company.documentCounters || {};
        
        // Fix PDCN counter
        const lastNote = await db.FinancialNote.findOne({
            where: { noteNo: { [db.Sequelize.Op.like]: 'E-PDCN-26-27-%' } },
            order: [['createdAt', 'DESC']]
        });

        if (lastNote) {
            console.log("Last existing PDCN Note:", lastNote.noteNo);
            const numPart = parseInt(lastNote.noteNo.split('-').pop());
            if (!isNaN(numPart)) {
                if (!counters.pdcn) counters.pdcn = { prefix: "E-PDCN-26-27-", nextNumber: 0 };
                counters.pdcn.nextNumber = numPart;
                console.log("Updating PDCN counter to:", numPart);
            }
        }

        await company.update({ documentCounters: counters });
        console.log("Counters synced successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fix();
