const db = require('../models');

async function syncBalances() {
    const stockists = await db.Stockist.findAll();
    console.log(`Checking balances for ${stockists.length} parties...`);

    for (const s of stockists) {
        const [invoices, notes, payments, purchases] = await Promise.all([
            db.Invoice.findAll({ where: { stockistId: s.id } }),
            db.FinancialNote.findAll({ where: { stockistId: s.id } }),
            db.Payment.findAll({ where: { stockistId: s.id } }),
            db.PurchaseEntry.findAll({ where: { supplierId: s.id } })
        ]);

        let calculatedBalance = 0;

        // Invoices are Debits (increase balance for customers)
        invoices.forEach(i => calculatedBalance += parseFloat(i.grandTotal || 0));

        // CN are Credits (decrease balance), DN are Debits (increase balance)
        notes.forEach(n => {
            if (n.noteType === 'CN') calculatedBalance -= parseFloat(n.amount || 0);
            else if (n.noteType === 'DN') calculatedBalance += parseFloat(n.amount || 0);
        });

        // RECEIPT are Credits (decrease balance), PAYMENT are Debits (increase balance)
        payments.forEach(p => {
            if (p.type === 'RECEIPT') calculatedBalance -= parseFloat(p.amount || 0);
            else if (p.type === 'PAYMENT') calculatedBalance += parseFloat(p.amount || 0);
        });

        // Purchases are Credits (decrease balance for the company/increase for supplier)
        purchases.forEach(p => calculatedBalance -= parseFloat(p.grandTotal || 0));

        if (Math.abs(s.outstandingBalance - calculatedBalance) > 0.01) {
            console.log(`Mismatch for ${s.name}: DB=${s.outstandingBalance}, Calc=${calculatedBalance}`);
            await s.update({ outstandingBalance: calculatedBalance });
            console.log(`✅ Fixed balance for ${s.name}`);
        }
    }
    console.log('Sync complete.');
    process.exit();
}

syncBalances();
