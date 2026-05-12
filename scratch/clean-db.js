const db = require('../models');

async function cleanDatabase() {
    try {
        console.log('Connecting to DB...');
        await db.sequelize.authenticate();
        console.log('DB Connection successful.');

        // 1. Delete all Purchase Entries and Items
        console.log('Deleting Purchase Items...');
        await db.PurchaseItem.destroy({ where: {} });
        console.log('Deleting Purchase Entries...');
        await db.PurchaseEntry.destroy({ where: {} });

        // 2. Delete all Orders and OrderItems
        console.log('Deleting Order Items...');
        await db.OrderItem.destroy({ where: {} });
        console.log('Deleting Orders...');
        await db.Order.destroy({ where: {} });

        // 3. Delete all Invoices and InvoiceItems
        console.log('Deleting Invoice Items...');
        await db.InvoiceItem.destroy({ where: {} });
        console.log('Deleting Invoices...');
        await db.Invoice.destroy({ where: {} });

        // 4. Reset Product Master Fields
        console.log('Resetting Product Master fields (qty, ptr, pts, packing, mrp)...');
        await db.Product.update(
            { qtyAvailable: 0, ptr: 0, pts: 0, packing: '', mrp: 0 },
            { where: {} }
        );

        // 5. Delete all Batches
        console.log('Deleting all Batches...');
        await db.Batch.destroy({ where: {} });

        // 6. Reset Company Document Counters (Purchase, Invoice, Order)
        console.log('Resetting Company Document Counters...');
        const company = await db.Company.findOne();
        if (company) {
            const counters = company.documentCounters || {};
            counters['purchase'] = 0;
            counters['invoice'] = 0;
            counters['order'] = 0;
            company.documentCounters = counters;
            company.changed('documentCounters', true);
            await company.save();
            console.log('Document counters reset to 0.');
        }

        console.log('Database cleanup complete.');
    } catch (error) {
        console.error('Error cleaning database:', error);
    } finally {
        await db.sequelize.close();
    }
}

cleanDatabase();
