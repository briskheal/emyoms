const db = require('../models');

async function checkInvoices() {
    try {
        const items = await db.InvoiceItem.findAll({
            where: {
                gstPercent: 12
            },
            include: [{
                model: db.Invoice,
                attributes: ['invoiceNo', 'id']
            }]
        });

        console.log(`Found ${items.length} items with 12% GST.`);
        
        const invoiceIds = [...new Set(items.map(item => item.invoiceId))];
        console.log(`Unique Invoices to delete: ${invoiceIds.length}`);
        
        for (const id of invoiceIds) {
            const invoice = await db.Invoice.findByPk(id);
            if (invoice) {
                console.log(`- Invoice No: ${invoice.invoiceNo} (ID: ${invoice.id})`);
            }
        }
    } catch (error) {
        console.error('Error checking invoices:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkInvoices();
