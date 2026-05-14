const db = require('../models');

async function resetSystem() {
    console.log('🚀 Starting System Reset...');
    try {
        // 1. Delete Transactions in correct order to respect FK constraints
        console.log('🗑️ Deleting Transactional Data...');
        
        // Items first
        await db.InvoiceItem.destroy({ where: {} });
        await db.PurchaseItem.destroy({ where: {} });
        await db.OrderItem.destroy({ where: {} });
        await db.NoteItem.destroy({ where: {} });
        await db.PDCNClaimItem.destroy({ where: {} });
        
        // Headers second
        await db.Invoice.destroy({ where: {} });
        await db.PurchaseEntry.destroy({ where: {} });
        await db.Order.destroy({ where: {} });
        await db.Payment.destroy({ where: {} });
        await db.FinancialNote.destroy({ where: {} });
        await db.PDCNClaim.destroy({ where: {} });
        await db.Expense.destroy({ where: {} });

        // 2. Reset Inventory to 0
        console.log('📉 Resetting Inventory Levels...');
        await db.Product.update({ qtyAvailable: 0 }, { where: {} });
        await db.Batch.update({ qtyAvailable: 0 }, { where: {} });

        // 3. Reset Document Counters
        console.log('🔢 Reinitializing Document Counters...');
        const company = await db.Company.findOne();
        if (company) {
            // Resetting to empty object will force getNextDocNo to start from prefix-0001
            await company.update({ documentCounters: {} });
        }

        // 4. Reset Stockist Outstanding Balances (Optional but recommended for full reset)
        console.log('💰 Resetting Stockist Outstanding Balances to 0...');
        await db.Stockist.update({ outstandingBalance: 0 }, { where: {} });

        console.log('✨ SYSTEM RESET COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (e) {
        console.error('❌ RESET FAILED:', e);
        process.exit(1);
    }
}

resetSystem();
