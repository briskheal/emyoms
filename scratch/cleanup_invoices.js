const db = require('../models');

async function cleanupInconsistentInvoices() {
    try {
        console.log("--- Starting Cleanup of Inconsistent Invoices ---");
        
        // 1. Fetch all invoices with items and products
        const invoices = await db.Invoice.findAll({
            include: [{
                model: db.InvoiceItem,
                as: 'items',
                include: [{ model: db.Product }]
            }]
        });

        console.log(`Found ${invoices.length} total invoices.`);

        for (const inv of invoices) {
            let isInconsistent = false;
            for (const item of inv.items) {
                if (item.Product) {
                    const masterGst = parseFloat(item.Product.gstPercent);
                    const billedGst = parseFloat(item.gstPercent);
                    if (masterGst !== billedGst) {
                        console.log(`Invoice ${inv.invoiceNo} is inconsistent: ${item.name} Billed:${billedGst}% vs Master:${masterGst}%`);
                        isInconsistent = true;
                        break;
                    }
                }
            }

            if (isInconsistent) {
                console.log(`Deleting Invoice ${inv.invoiceNo}...`);
                
                // Update Order status if exists
                if (inv.orderId) {
                    await db.Order.update({ status: 'approved' }, { where: { id: inv.orderId } });
                    console.log(`- Order ${inv.orderId} status set to 'approved'`);
                }

                // Adjust Stockist Balance
                const stockist = await db.Stockist.findByPk(inv.stockistId);
                if (stockist) {
                    await stockist.decrement('outstandingBalance', { by: inv.grandTotal });
                    console.log(`- Adjusted balance for stockist ${stockist.name} (-₹${inv.grandTotal})`);
                }

                // Delete Items and Invoice
                await db.InvoiceItem.destroy({ where: { invoiceId: inv.id } });
                await inv.destroy();
                console.log(`- Invoice ${inv.invoiceNo} and its items deleted.`);
            }
        }

        console.log("--- Cleanup Complete ---");

    } catch (err) {
        console.error("Error during cleanup:", err);
    } finally {
        process.exit();
    }
}

cleanupInconsistentInvoices();
