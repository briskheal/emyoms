const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let serverJS = fs.readFileSync(path, 'utf8');

const newFunc = `
async function autoPostSalesJV(invoice, stockist) {
    const salesLedger = await db.Ledger.findOne({ where: { name: 'Sales Account' } });
    const gstLedger = await db.Ledger.findOne({ where: { name: 'GST Payable' } });

    const jvNo = await getNextDocNo('jv');

    const jv = await db.JournalVoucher.create({
        jvNo,
        date: invoice.date || new Date(),
        narration: \`Auto JV: Sales Invoice \${invoice.invoiceNo} to \${stockist ? stockist.name : 'Unknown Customer'}\`,
        totalAmount: invoice.grandTotal,
        refType: 'Sales',
        refId: invoice.id
    });

    const lines = [];

    // DR: Customer (Grand Total)
    lines.push({
        jvId: jv.id,
        type: 'DR',
        amount: invoice.grandTotal,
        entityType: 'Stockist',
        entityId: stockist ? stockist.id : null,
        entityName: stockist ? stockist.name : 'Unknown Customer',
        notes: \`Invoice \${invoice.invoiceNo}\`
    });

    // CR: Sales (Subtotal + Other Charges)
    const salesVal = Number(invoice.subTotal || 0) + Number(invoice.otherChargesTotal || 0);
    if (salesVal > 0) {
        lines.push({
            jvId: jv.id,
            type: 'CR',
            amount: salesVal,
            entityType: 'Ledger',
            entityId: salesLedger ? salesLedger.id : null,
            entityName: 'Sales Account',
            notes: \`Sales Value + Charges\`
        });
    }

    // CR: GST Output
    const gstVal = Number(invoice.gstAmount || 0);
    if (gstVal > 0) {
        lines.push({
            jvId: jv.id,
            type: 'CR',
            amount: gstVal,
            entityType: 'Ledger',
            entityId: gstLedger ? gstLedger.id : null,
            entityName: 'GST Payable',
            notes: \`Output GST\`
        });
    }

    await db.JournalEntryLine.bulkCreate(lines);
}
`;

// Insert the function above app.post('/api/admin/direct-sale'
const insertIdx = serverJS.indexOf("app.post('/api/admin/direct-sale'");
if (insertIdx !== -1) {
    serverJS = serverJS.substring(0, insertIdx) + newFunc + "\n" + serverJS.substring(insertIdx);
} else {
    console.error("Endpoint not found.");
    process.exit(1);
}

// Now replace the block inside the endpoint
const oldBlock = `        if (stockist) {
            await stockist.increment('outstandingBalance', { by: numGrandTotal });
        }`;

const newBlock = `        if (stockist) {
            await stockist.increment('outstandingBalance', { by: numGrandTotal });
            // Generate Auto JV for Sales
            try {
                await autoPostSalesJV(newInvoice, stockist);
            } catch(err) { console.error("Auto JV failed for sales:", err); }
        }`;

if (serverJS.includes(oldBlock)) {
    serverJS = serverJS.replace(oldBlock, newBlock);
    fs.writeFileSync(path, serverJS);
    console.log("SUCCESS: Auto JV for Direct Sales added.");
} else {
    console.log("Could not find block to replace.");
}
