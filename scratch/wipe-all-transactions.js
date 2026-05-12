const db = require('../models');

async function wipeAllTransactions() {
    console.log("🚀 Starting complete transaction wipe for re-checking...");
    
    try {
        // 1. Delete all Invoice and Order related items
        await db.InvoiceItem.destroy({ where: {}, truncate: { cascade: true } });
        await db.Invoice.destroy({ where: {}, truncate: { cascade: true } });
        await db.OrderItem.destroy({ where: {}, truncate: { cascade: true } });
        await db.Order.destroy({ where: {}, truncate: { cascade: true } });
        console.log("✅ All Invoices and Orders deleted.");

        // 2. Reset Stockist Balances
        await db.Stockist.update({ outstandingBalance: 0 }, { where: {} });
        console.log("✅ All Stockist outstanding balances reset to 0.");

        // 3. Reset Inventory (Crucial: Restore from Purchases)
        // Set all available qty to 0 first
        await db.Product.update({ qtyAvailable: 0 }, { where: {} });
        await db.Batch.update({ qtyAvailable: 0 }, { where: {} });
        console.log("✅ Inventory counters reset. Restoring from Purchase history...");

        // Re-apply all Purchase Entries to get original stock
        const purchases = await db.PurchaseEntry.findAll({
            include: [{ model: db.PurchaseItem, as: 'items' }]
        });

        for (const p of purchases) {
            for (const item of p.items) {
                const total = (Number(item.qty) || 0);
                await db.Product.increment('qtyAvailable', { by: total, where: { id: item.productId } });
                await db.Batch.increment('qtyAvailable', { by: total, where: { productId: item.productId, batchNo: item.batch } });
            }
        }
        console.log("✅ Inventory restored from Purchase history.");

        // 4. Reset Document Counters
        const company = await db.Company.findOne();
        if (company) {
            await company.update({ documentCounters: {} });
            console.log("✅ Document counters reset to start from #0001.");
        }

        console.log("✨ ALL TRANSACTIONS WIPED. SYSTEM READY FOR RE-CHECK.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Wipe failed:", error);
        process.exit(1);
    }
}

wipeAllTransactions();
