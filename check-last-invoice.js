const db = require('./models');

async function runCheck() {
    try {
        console.log('Connecting to database...');
        await db.sequelize.authenticate();
        console.log('✅ Connected to database.');

        // 1. Fetch all Invoice Templates (OCR Map Layouts)
        console.log('\n--- Active OCR Templates (Map Layouts) ---');
        const templates = await db.InvoiceTemplate.findAll();
        if (templates.length === 0) {
            console.log('No Invoice Templates found.');
        } else {
            for (const t of templates) {
                // Find stockist name
                const stockist = await db.Stockist.findByPk(t.stockistId);
                console.log(`Stockist: ${stockist ? stockist.name : 'Unknown'} (ID: ${t.stockistId})`);
                console.log(`Anchor Keyword: "${t.anchorKeyword}"`);
                console.log(`Product Col: [${t.colProductStart} - ${t.colProductEnd}]`);
                console.log(`HSN Col: [${t.colHSNStart} - ${t.colHSNEnd}]`);
                console.log(`Batch Col: [${t.colBatchStart} - ${t.colBatchEnd}]`);
                console.log(`Exp Col: [${t.colExpStart} - ${t.colExpEnd}]`);
                console.log(`MRP Col: [${t.colMRPStart} - ${t.colMRPEnd}]`);
                console.log(`Rate Col: [${t.colRateStart} - ${t.colRateEnd}]`);
                console.log(`Qty Col: [${t.colQtyStart} - ${t.colQtyEnd}]`);
                console.log('-------------------------------------------');
            }
        }

        // 2. Fetch the latest Invoice and its items (from the external registry)
        console.log('\n--- Latest 3 Invoices in Database ---');
        const latestInvoices = await db.Invoice.findAll({
            limit: 3,
            order: [['createdAt', 'DESC']],
            include: [{ model: db.InvoiceItem, as: 'items' }]
        });

        if (latestInvoices.length === 0) {
            console.log('No invoices found.');
        } else {
            for (const inv of latestInvoices) {
                const stockist = await db.Stockist.findByPk(inv.stockistId);
                console.log(`\nInvoice ID: ${inv.id}`);
                console.log(`Invoice No: ${inv.invoiceNo} | Date: ${inv.date}`);
                console.log(`Stockist: ${stockist ? stockist.name : 'Unknown'} (ID: ${inv.stockistId})`);
                console.log(`Grand Total: ${inv.grandTotal}`);
                console.log(`Items (${inv.items ? inv.items.length : 0}):`);
                if (inv.items) {
                    inv.items.forEach(item => {
                        console.log(`  - Name: "${item.name}" | HSN: "${item.hsn}" | Qty: ${item.qty} | Rate: ${item.rate} | Batch: "${item.batch}" | Exp: "${item.expDate}"`);
                    });
                }
            }
        }

        // 3. Fetch the latest Purchase Entries (since the user mentioned "last invoice parsed and saved")
        console.log('\n--- Latest 3 Purchase Entries ---');
        const latestPurchases = await db.PurchaseEntry.findAll({
            limit: 3,
            order: [['createdAt', 'DESC']],
            include: [{ model: db.PurchaseItem, as: 'items' }]
        });

        if (latestPurchases.length === 0) {
            console.log('No purchase entries found.');
        } else {
            for (const pe of latestPurchases) {
                const stockist = await db.Stockist.findByPk(pe.supplierId);
                console.log(`\nPurchase Entry ID: ${pe.id}`);
                console.log(`Purchase No (billNo): ${pe.purchaseNo} | Invoice No: ${pe.supplierInvoiceNo}`);
                console.log(`Supplier: ${stockist ? stockist.name : 'Unknown'} (ID: ${pe.supplierId})`);
                console.log(`Grand Total: ${pe.grandTotal}`);
                console.log(`Items (${pe.items ? pe.items.length : 0}):`);
                if (pe.items) {
                    pe.items.forEach(item => {
                        console.log(`  - Name: "${item.name}" | HSN: "${item.hsn}" | Qty: ${item.qty} | Rate: ${item.purchaseRate} | Batch: "${item.batch}" | Exp: "${item.expDate}"`);
                    });
                }
            }
        }

        process.exit(0);
    } catch (e) {
        console.error('Error running check:', e);
        process.exit(1);
    }
}

runCheck();
