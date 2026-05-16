const db = require('./models');

async function purge() {
    try {
        console.log("🚀 Starting selective data purge...");
        
        // Order matters for some DBs, but cascade: true handles most cases
        const modelsToPurge = [
            { m: db.PurchaseItem, name: 'PurchaseItem' },
            { m: db.PurchaseEntry, name: 'PurchaseEntry' },
            { m: db.InvoiceItem, name: 'InvoiceItem' },
            { m: db.Invoice, name: 'Invoice' },
            { m: db.OrderItem, name: 'OrderItem' },
            { m: db.Order, name: 'Order' },
            { m: db.PDCNClaimItem, name: 'PDCNClaimItem' },
            { m: db.PDCNClaim, name: 'PDCNClaim' },
            { m: db.NoteItem, name: 'NoteItem' },
            { m: db.FinancialNote, name: 'FinancialNote' },
            { m: db.PaymentLink, name: 'PaymentLink' },
            { m: db.Payment, name: 'Payment' },
            { m: db.Expense, name: 'Expense' },
            { m: db.JournalEntryLine, name: 'JournalEntryLine' },
            { m: db.JournalVoucher, name: 'JournalVoucher' },
            { m: db.Media, name: 'Media' }
        ];

        for (const item of modelsToPurge) {
            if (item.m) {
                console.log(`🗑️ Clearing ${item.name}...`);
                await item.m.destroy({ where: {}, truncate: true, cascade: true }).catch(async (err) => {
                    console.warn(`⚠️ Truncate failed for ${item.name}, falling back to delete:`, err.message);
                    await item.m.destroy({ where: {}, cascade: true });
                });
            }
        }

        console.log("📉 Resetting master data states...");
        await db.Product.update({ qtyAvailable: 0 }, { where: {} });
        await db.Batch.update({ qtyAvailable: 0 }, { where: {} });
        await db.Stockist.update({ outstandingBalance: 0 }, { where: {} });

        console.log("🔢 Resetting document counters...");
        const company = await db.Company.findOne();
        if (company) {
            await company.update({ documentCounters: {} });
        }

        console.log("✅ Selective purge complete!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Purge failed:", e);
        process.exit(1);
    }
}

purge();
