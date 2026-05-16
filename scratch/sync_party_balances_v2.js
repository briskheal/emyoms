const db = require('../models');

async function syncBalances() {
    console.log("Synchronizing Party Balances...");

    const stockists = await db.Stockist.findAll();
    const lines = await db.JournalEntryLine.findAll();

    for (const s of stockists) {
        let bal = Number(s.openingBalance || 0);
        
        const myLines = lines.filter(l => l.entityType === 'Stockist' && l.entityId === s.id);
        myLines.forEach(l => {
            if (l.type === 'DR') bal += Number(l.amount);
            else bal -= Number(l.amount);
        });

        await s.update({ outstandingBalance: bal });
        console.log("Updated " + s.name + ": " + bal);
    }

    console.log("Sync finished.");
    process.exit(0);
}

syncBalances();
