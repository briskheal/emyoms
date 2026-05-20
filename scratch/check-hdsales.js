const db = require('../models');

async function checkHdSales() {
    try {
        const stockist = await db.Stockist.findByPk(3);
        console.log("=== STOCKIST ===");
        if (stockist) {
            console.log(JSON.stringify(stockist.toJSON(), null, 2));
        } else {
            console.log("Stockist with ID 3 not found.");
        }

        const template = await db.InvoiceTemplate.findOne({ where: { stockistId: 3 } });
        console.log("\n=== TEMPLATE ===");
        if (template) {
            console.log(JSON.stringify(template.toJSON(), null, 2));
        } else {
            console.log("Template for stockist 3 not found.");
        }

        const invoices = await db.Invoice.findAll({ where: { stockistId: 3 } });
        console.log(`\n=== INVOICES count: ${invoices.length} ===`);
        invoices.forEach(inv => {
            console.log(`ID: ${inv.id} | InvoiceNo: ${inv.invoiceNo} | Date: ${inv.date} | GrandTotal: ${inv.grandTotal}`);
        });

        const purchaseEntries = await db.PurchaseEntry.findAll({ where: { supplierId: 3 } });
        console.log(`\n=== PURCHASE ENTRIES count: ${purchaseEntries.length} ===`);
        purchaseEntries.forEach(pe => {
            console.log(`ID: ${pe.id} | PurchaseNo: ${pe.purchaseNo} | Date: ${pe.date} | GrandTotal: ${pe.grandTotal}`);
        });

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

checkHdSales();
