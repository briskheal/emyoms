const db = require('../models');

async function checkInvoice48() {
    try {
        const inv = await db.Invoice.findByPk(48, {
            include: [{ model: db.InvoiceItem, as: 'items' }]
        });
        if (!inv) {
            console.log("Invoice 48 not found.");
            process.exit(1);
        }
        console.log("=== INVOICE ===");
        console.log(JSON.stringify(inv.toJSON(), null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkInvoice48();
