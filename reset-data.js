const db = require('./models');
const dns = require('dns');

// Use Google DNS to bypass ISP resolution issues
dns.setServers(['8.8.8.8']);

async function resetData() {
    try {
        console.log("🚀 Starting Comprehensive System Reset...");

        // 1. Delete Purchase Details
        console.log("🗑️ Deleting Purchase details...");
        await db.PurchaseItem.destroy({ where: {}, truncate: false, cascade: true });
        await db.PurchaseEntry.destroy({ where: {}, truncate: false, cascade: true });

        // 2. Delete Sales & Order Details
        console.log("🗑️ Deleting Sales and Order details...");
        await db.InvoiceItem.destroy({ where: {}, truncate: false, cascade: true });
        await db.Invoice.destroy({ where: {}, truncate: false, cascade: true });
        await db.OrderItem.destroy({ where: {}, truncate: false, cascade: true });
        await db.Order.destroy({ where: {}, truncate: false, cascade: true });

        // 3. Delete PDCN Claims
        console.log("🗑️ Deleting PDCN Claims...");
        await db.PDCNClaimItem.destroy({ where: {}, truncate: false, cascade: true });
        await db.PDCNClaim.destroy({ where: {}, truncate: false, cascade: true });

        // 4. Delete Financial Records
        console.log("🗑️ Deleting Financial records (Notes, Payments, Expenses)...");
        await db.NoteItem.destroy({ where: {}, truncate: false, cascade: true });
        await db.FinancialNote.destroy({ where: {}, truncate: false, cascade: true });
        await db.PaymentLink.destroy({ where: {}, truncate: false, cascade: true });
        await db.Payment.destroy({ where: {}, truncate: false, cascade: true });
        await db.Expense.destroy({ where: {}, truncate: false, cascade: true });

        // 5. Delete Accounting Records (Journal)
        console.log("🗑️ Deleting Journal Vouchers and Entry Lines...");
        await db.JournalEntryLine.destroy({ where: {}, truncate: false, cascade: true });
        await db.JournalVoucher.destroy({ where: {}, truncate: false, cascade: true });

        // 6. Delete Media
        console.log("🗑️ Deleting Media records...");
        await db.Media.destroy({ where: {} });

        // 7. Reset Master Data States
        console.log("📉 Resetting Product and Batch quantities to zero...");
        await db.Product.update({ qtyAvailable: 0 }, { where: {} });
        await db.Batch.update({ qtyAvailable: 0 }, { where: {} });
        
        console.log("💰 Resetting Stockist and Supplier balances to zero...");
        await db.Stockist.update({ outstandingBalance: 0 }, { where: {} });

        // 8. Reset Document Counters (Preserving Prefix Templates)
        console.log("🔢 Resetting document counters...");
        const company = await db.Company.findOne();
        if (company) {
            const currentCounters = company.documentCounters || {};
            const resetCounters = {};
            for (const key of Object.keys(currentCounters)) {
                resetCounters[key] = {
                    prefix: currentCounters[key]?.prefix || "",
                    nextNumber: 0
                };
            }
            await company.update({ documentCounters: resetCounters });
        }

        console.log("✅ System Reset Complete! Master data preserved.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Reset Failed:", error);
        process.exit(1);
    }
}

resetData();
