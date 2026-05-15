const db = require('../models');

async function syncInvoiceSchema() {
    console.log('--- Syncing Invoices Schema ---');
    try {
        await db.sequelize.authenticate();
        console.log('Connected.');

        // Add otherChargesTotal
        await db.sequelize.query('ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "otherChargesTotal" DECIMAL(15, 2) DEFAULT 0');
        console.log('Added otherChargesTotal.');

        // Add additionalCharges
        await db.sequelize.query('ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "additionalCharges" JSONB');
        console.log('Added additionalCharges.');

        console.log('--- Sync Complete ---');
    } catch (e) {
        console.error('Sync failed:', e.message);
    } finally {
        await db.sequelize.close();
    }
}

syncInvoiceSchema();
