const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let serverJS = fs.readFileSync(path, 'utf8');

const newFunc = `
async function autoPostPurchaseJV(entry, stockist) {
    const stockLedger = await db.Ledger.findOne({ where: { name: 'Opening Stock' } });
    const gstLedger = await db.Ledger.findOne({ where: { name: 'GST Payable' } });

    const jvNo = await getNextDocNo('jv');

    const jv = await db.JournalVoucher.create({
        jvNo,
        date: entry.invoiceDate || new Date(),
        narration: \`Auto JV: Purchase Inward \${entry.purchaseNo} from \${stockist ? stockist.name : 'Unknown Supplier'}\`,
        totalAmount: entry.grandTotal,
        refType: 'Purchase',
        refId: entry.id
    });

    const lines = [];

    // DR: Stock (Purchase Value + Other Charges)
    const purchaseVal = Number(entry.subTotal || 0) + Number(entry.otherChargesTotal || 0);
    if (purchaseVal > 0) {
        lines.push({
            jvId: jv.id,
            type: 'DR',
            amount: purchaseVal,
            entityType: 'Ledger',
            entityId: stockLedger ? stockLedger.id : null,
            entityName: 'Opening Stock',
            notes: \`Purchase Value + Charges\`
        });
    }

    // DR: GST Input
    const gstVal = Number(entry.gstAmount || 0);
    if (gstVal > 0) {
        lines.push({
            jvId: jv.id,
            type: 'DR',
            amount: gstVal,
            entityType: 'Ledger',
            entityId: gstLedger ? gstLedger.id : null,
            entityName: 'GST Payable',
            notes: \`Input GST\`
        });
    }

    // CR: Supplier
    lines.push({
        jvId: jv.id,
        type: 'CR',
        amount: entry.grandTotal,
        entityType: 'Stockist',
        entityId: stockist ? stockist.id : null,
        entityName: stockist ? stockist.name : 'Unknown Supplier',
        notes: \`Invoice \${entry.supplierInvoiceNo || ''}\`
    });

    await db.JournalEntryLine.bulkCreate(lines);
}
`;

// Insert the function above app.post('/api/admin/purchase-entries'
const insertIdx = serverJS.indexOf("app.post('/api/admin/purchase-entries'");
if (insertIdx !== -1) {
    serverJS = serverJS.substring(0, insertIdx) + newFunc + "\n" + serverJS.substring(insertIdx);
} else {
    console.error("Endpoint not found.");
    process.exit(1);
}

// Now replace the block inside the endpoint
const oldBlock = `        if (supplierId) {
            const stockist = await db.Stockist.findByPk(supplierId);
            if (stockist) {
                await stockist.increment('outstandingBalance', { by: grandTotal });
            }
        }`;

const newBlock = `        if (supplierId) {
            const stockist = await db.Stockist.findByPk(supplierId);
            if (stockist) {
                await stockist.increment('outstandingBalance', { by: grandTotal });
                // Generate Auto JV for Purchase
                try {
                    await autoPostPurchaseJV(entry, stockist);
                } catch(err) { console.error("Auto JV failed for purchase:", err); }
            }
        }`;

if (serverJS.includes(oldBlock)) {
    serverJS = serverJS.replace(oldBlock, newBlock);
    fs.writeFileSync(path, serverJS);
    console.log("SUCCESS: Auto JV for Purchase Inward added.");
} else {
    console.log("Could not find block to replace.");
}
