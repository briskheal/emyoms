const { Sequelize } = require('sequelize');
const db = require('../models');

async function fixAllStockistBalances() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected to DB');

        const stockists = await db.Stockist.findAll();
        console.log(`Found ${stockists.length} stockists/parties.`);

        for (const s of stockists) {
            const partyId = s.id;
            
            const [invoices, notes, payments, purchases, jvLines] = await Promise.all([
                db.Invoice.findAll({ where: { stockistId: partyId, status: { [Sequelize.Op.ne]: 'cancelled' } } }),
                db.FinancialNote.findAll({ where: { stockistId: partyId } }),
                db.Payment.findAll({ where: { stockistId: partyId } }),
                db.PurchaseEntry.findAll({ where: { supplierId: partyId } }), // Might not have a status if they can't be cancelled easily, but just in case
                db.JournalEntryLine.findAll({ 
                    where: { entityType: 'Stockist', entityId: partyId },
                })
            ]);

            let totalDebit = 0;
            let totalCredit = 0;

            invoices.forEach(i => totalDebit += parseFloat(i.grandTotal || 0));
            
            notes.forEach(n => {
                if (n.noteType === 'DN') totalDebit += parseFloat(n.amount || 0);
                if (n.noteType === 'CN') totalCredit += parseFloat(n.amount || 0);
            });

            payments.forEach(p => {
                if (p.type === 'PAYMENT') totalDebit += parseFloat(p.amount || 0);
                if (p.type === 'RECEIPT') totalCredit += parseFloat(p.amount || 0);
            });

            purchases.forEach(p => totalCredit += parseFloat(p.grandTotal || 0));

            jvLines.forEach(l => {
                if (l.type === 'DR') totalDebit += parseFloat(l.amount || 0);
                if (l.type === 'CR') totalCredit += parseFloat(l.amount || 0);
            });

            const calculatedBalance = Math.round((totalDebit - totalCredit) * 100) / 100;
            const currentBalance = Math.round(parseFloat(s.outstandingBalance || 0) * 100) / 100;

            if (calculatedBalance !== currentBalance) {
                console.log(`Updating ${s.name} (ID: ${s.id}): from ${currentBalance} to ${calculatedBalance}`);
                await s.update({ outstandingBalance: calculatedBalance });
            }
        }

        console.log('Finished updating all party balances.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixAllStockistBalances();
