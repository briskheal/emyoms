const db = require('../models');

async function fullTransactionalCleanup() {
    console.log('🚀 Starting Full Transactional Data Cleanup...');
    const t = await db.sequelize.transaction();

    try {
        // 1. Delete Items (Child Records)
        console.log('- Cleaning up itemized records...');
        await db.InvoiceItem.destroy({ where: {}, transaction: t });
        await db.OrderItem.destroy({ where: {}, transaction: t });
        await db.PDCNClaimItem.destroy({ where: {}, transaction: t });
        await db.NoteItem.destroy({ where: {}, transaction: t });
        await db.PurchaseItem.destroy({ where: {}, transaction: t });

        // 2. Delete Main Documents
        console.log('- Cleaning up primary documents...');
        await db.Invoice.destroy({ where: {}, transaction: t });
        await db.Order.destroy({ where: {}, transaction: t });
        await db.PDCNClaim.destroy({ where: {}, transaction: t });
        await db.FinancialNote.destroy({ where: {}, transaction: t });
        await db.PurchaseEntry.destroy({ where: {}, transaction: t });
        
        // 3. Delete Financial & Ledger Records
        console.log('- Cleaning up payments and expenses...');
        await db.Payment.destroy({ where: {}, transaction: t });
        await db.Expense.destroy({ where: {}, transaction: t });

        // 4. Reset Master Balances
        console.log('- Resetting Party balances to zero...');
        await db.Stockist.update(
            { outstandingBalance: 0 },
            { where: {}, transaction: t }
        );

        // 5. Reset Document Counters (Optional but recommended for "fresh start")
        console.log('- Resetting document counters in Company Settings...');
        const company = await db.Company.findOne({ transaction: t });
        if (company && company.documentCounters) {
            const counters = company.documentCounters;
            Object.keys(counters).forEach(key => {
                if (counters[key].nextNumber) {
                    counters[key].nextNumber = 1;
                }
            });
            await company.update({ documentCounters: counters }, { transaction: t });
        }

        await t.commit();
        console.log('✅ DATABASE CLEANED SUCCESSFULLY. All transactional data removed.');
        console.log('✅ Stockist balances reset to 0.00.');
        console.log('✅ Document counters reset to 1.');

    } catch (error) {
        await t.rollback();
        console.error('❌ CLEANUP FAILED:', error);
    } finally {
        await db.sequelize.close();
    }
}

fullTransactionalCleanup();
