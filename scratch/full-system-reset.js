const db = require('../models');

async function fullReset() {
    console.log("Starting full data cleanup and system reset...");

    try {
        // 1. Transactional Data Deletion (Order Matters for Foreign Keys)
        console.log("Cleaning up transactional tables...");
        
        // Journal Entries & Vouchers
        await db.JournalEntryLine.destroy({ where: {}, truncate: false });
        await db.JournalVoucher.destroy({ where: {}, truncate: false });

        // Sales & Invoices
        await db.InvoiceItem.destroy({ where: {}, truncate: false });
        await db.Invoice.destroy({ where: {}, truncate: false });
        await db.OrderItem.destroy({ where: {}, truncate: false });
        await db.Order.destroy({ where: {}, truncate: false });

        // Purchases
        await db.PurchaseItem.destroy({ where: {}, truncate: false });
        await db.PurchaseEntry.destroy({ where: {}, truncate: false });

        // Financial Notes & PDCNs
        await db.FinancialNote.destroy({ where: {}, truncate: false });
        await db.PDCNClaim.destroy({ where: {}, truncate: false });

        // Expenses
        await db.Expense.destroy({ where: {}, truncate: false });

        // Payments
        await db.Payment.destroy({ where: {}, truncate: false });

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
            
            // Loop through all counter types and reset nextNumber to 0 without touching prefix
            Object.keys(counters).forEach(type => {
                if (counters[type]) {
                    counters[type].nextNumber = 0;
                    console.log(\`Reset counter for \${type} (Prefix: \${counters[type].prefix})\`);
                }
            });

            company.documentCounters = counters;
            company.changed('documentCounters', true);
            await company.save();
            console.log("Document counters reset successfully.");
        } else {
            console.warn("No company counters found to reset.");
        }

        console.log("\n✅ SYSTEM RESET COMPLETE. The platform is now clean and ready for fresh entries.");
    } catch (error) {
        console.error("❌ Reset Failed:", error.message);
    }
    
    process.exit(0);
}

fullReset();
