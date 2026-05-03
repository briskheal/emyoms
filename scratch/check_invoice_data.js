const db = require('../models');

async function checkInvoiceData() {
    try {
        const lastInvoice = await db.Invoice.findOne({
            order: [['createdAt', 'DESC']],
            include: [{ model: db.InvoiceItem, as: 'items' }]
        });

        if (!lastInvoice) {
            console.log("No invoices found.");
            return;
        }

        console.log("--- Last Invoice Details ---");
        console.log("Invoice No:", lastInvoice.invoiceNo);
        console.log("Items Count:", lastInvoice.items.length);
        
        if (lastInvoice.items.length > 0) {
            const item = lastInvoice.items[0];
            console.log("First Item Data:", JSON.stringify(item.toJSON(), null, 2));
        }
    } catch (err) {
        console.error("Error checking data:", err);
    } finally {
        process.exit();
    }
}

checkInvoiceData();
