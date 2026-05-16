const db = require('../models');

async function fullReset() {
    console.log("Starting full data cleanup and system reset...");

    try {
        // 1. Transactional Data Deletion
        console.log("Cleaning up transactional tables...");
        
        // Use bulk delete to bypass FK issues if possible or handle in order
        // Destroy all transaction records
        await db.JournalEntryLine.destroy({ where: {}, force: true });
        await db.JournalVoucher.destroy({ where: {}, force: true });
        await db.InvoiceItem.destroy({ where: {}, force: true });
        await db.Invoice.destroy({ where: {}, force: true });
        await db.OrderItem.destroy({ where: {}, force: true });
        await db.Order.destroy({ where: {}, force: true });
        await db.PurchaseItem.destroy({ where: {}, force: true });
        await db.PurchaseEntry.destroy({ where: {}, force: true });
        await db.FinancialNote.destroy({ where: {}, force: true });
        await db.PDCNClaim.destroy({ where: {}, force: true });
        await db.Expense.destroy({ where: {}, force: true });
        await db.Payment.destroy({ where: {}, force: true });

        console.log("Transactional tables cleaned successfully.");

        // 2. Master Data Reset
        console.log("Resetting master data balances...");
        
        // Reset Stockist Balances to Opening Balances
        const stockists = await db.Stockist.findAll();
        for (const s of stockists) {
            await s.update({ outstandingBalance: Number(s.openingBalance || 0) });
        }
        
        // Reset Product & Batch Quantities to Zero
        await db.Product.update({ qtyAvailable: 0 }, { where: {} });
        await db.Batch.update({ qtyAvailable: 0 }, { where: {} });

        console.log("Master data reset successfully.");

        // 3. Document Counter Reset
        console.log("Resetting document counters...");
        const company = await db.Company.findOne();
        if (company && company.documentCounters) {
            const counters = JSON.parse(JSON.stringify(company.documentCounters));
            
            Object.keys(counters).forEach(type => {
                if (counters[type]) {
                    counters[type].nextNumber = 0;
                    console.log("Reset counter for " + type + " (Prefix: " + counters[type].prefix + ")");
                }
            });

            company.documentCounters = counters;
            company.changed('documentCounters', true);
            await company.save();
            console.log("Document counters reset successfully.");
        } else {
            console.warn("No company counters found to reset.");
        }

        console.log("\n✅ SYSTEM RESET COMPLETE. The platform is now clean.");
    } catch (error) {
        console.error("❌ Reset Failed:", error.message);
    }
    
    process.exit(0);
}

fullReset();
