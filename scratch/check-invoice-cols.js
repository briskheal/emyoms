const db = require('../models');

async function checkInvoiceColumns() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected.');

        const [results] = await db.sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Invoices'
        `);
        console.log('Invoice columns:', results.map(r => r.column_name));

    } catch (e) {
        console.error(e.message);
    } finally {
        await db.sequelize.close();
    }
}

checkInvoiceColumns();
