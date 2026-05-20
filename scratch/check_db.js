const db = require('../models');

async function check() {
    await db.sequelize.authenticate();
    const invoices = await db.Invoice.count({ where: { stockistId: 3 }});
    const templates = await db.InvoiceTemplate.count({ where: { stockistId: 3 }});
    
    console.log(`Stockist 3 -> Invoices: ${invoices}, Templates: ${templates}`);
    process.exit(0);
}
check();
