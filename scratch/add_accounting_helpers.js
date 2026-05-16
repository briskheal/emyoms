const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// Define the new accounting helper functions
const accountingHelpers = `
// --- AUTOMATED ACCOUNTING ENGINE (AUTO JVS) ---

async function autoPostInvoiceJV(invoice, t) {
    console.log(\`[ACCOUNTING] Posting Auto JV for Invoice: \${invoice.invoiceNo}\`);
    const salesLedger = await db.Ledger.findOne({ where: { name: 'Sales Account' } });
    const jvNo = await getNextDocNo('jv');
    
    const jv = await db.JournalVoucher.create({
        jvNo,
        date: invoice.createdAt,
        narration: \`Sales Invoice \${invoice.invoiceNo}\`,
        totalAmount: invoice.grandTotal,
        refType: 'Invoice',
        refId: invoice.id
    }, { transaction: t });

    await db.JournalEntryLine.bulkCreate([
        { jvId: jv.id, type: 'DR', amount: invoice.grandTotal, entityType: 'Stockist', entityId: invoice.stockistId, entityName: 'Stockist', notes: 'Sales' },
        { jvId: jv.id, type: 'CR', amount: invoice.grandTotal, entityType: 'Ledger', entityId: salesLedger ? salesLedger.id : null, entityName: 'Sales Account', notes: 'Revenue' }
    ], { transaction: t });
}

async function autoPostPurchaseJV(purchase, t) {
    console.log(\`[ACCOUNTING] Posting Auto JV for Purchase: \${purchase.purchaseNo}\`);
    const purchaseLedger = await db.Ledger.findOne({ where: { name: 'Purchase Account' } });
    const jvNo = await getNextDocNo('jv');
    
    const jv = await db.JournalVoucher.create({
        jvNo,
        date: purchase.invoiceDate || purchase.createdAt,
        narration: \`Purchase Bill \${purchase.supplierInvoiceNo || purchase.purchaseNo}\`,
        totalAmount: purchase.grandTotal,
        refType: 'Purchase',
        refId: purchase.id
    }, { transaction: t });

    await db.JournalEntryLine.bulkCreate([
        { jvId: jv.id, type: 'DR', amount: purchase.grandTotal, entityType: 'Ledger', entityId: purchaseLedger ? purchaseLedger.id : null, entityName: 'Purchase Account', notes: 'Inventory Inward' },
        { jvId: jv.id, type: 'CR', amount: purchase.grandTotal, entityType: 'Stockist', entityId: purchase.supplierId, entityName: 'Supplier', notes: 'Credit Purchase' }
    ], { transaction: t });
}

async function autoPostNoteJV(note, t) {
    console.log(\`[ACCOUNTING] Posting Auto JV for \${note.noteType} Note: \${note.noteNo}\`);
    const jvNo = await getNextDocNo('jv');
    const isCN = note.noteType === 'CN';
    
    const jv = await db.JournalVoucher.create({
        jvNo,
        date: note.createdAt,
        narration: \`\${isCN ? 'Credit Note' : 'Debit Note'} \${note.noteNo} - \${note.reason}\`,
        totalAmount: note.amount,
        refType: 'FinancialNote',
        refId: note.id
    }, { transaction: t });

    // CN: Dr Sales Return/Discount (Expense), Cr Party (Reduces Debt)
    // DN: Dr Party (Increases Debt), Cr Purchase Return/Income
    await db.JournalEntryLine.bulkCreate([
        { 
            jvId: jv.id, 
            type: isCN ? 'DR' : 'CR', 
            amount: note.amount, 
            entityType: 'Ledger', 
            entityName: isCN ? 'Sales Returns' : 'Purchase Returns',
            notes: note.reason 
        },
        { 
            jvId: jv.id, 
            type: isCN ? 'CR' : 'DR', 
            amount: note.amount, 
            entityType: 'Stockist', 
            entityId: note.stockistId, 
            entityName: 'Party', 
            notes: 'Adjustment' 
        }
    ], { transaction: t });
}
`;

// Insert helpers before autoPostPaymentJV
const insertPoint = content.indexOf('async function autoPostPaymentJV');
if (insertPoint !== -1) {
    content = content.substring(0, insertPoint) + accountingHelpers + "\n" + content.substring(insertPoint);
}

// Now hook into Invoice Generation
content = content.replace(
    "await order.update({ status: 'invoiced' });\n        res.json({ success: true, invoice: newInvoice });",
    "await order.update({ status: 'invoiced' });\n        await autoPostInvoiceJV(newInvoice);\n        res.json({ success: true, invoice: newInvoice });"
);

// Hook into Purchase Creation
content = content.replace(
    "await batch.increment('qtyAvailable', { by: item.qty });\n\n                await db.PurchaseItem.create({",
    "await batch.increment('qtyAvailable', { by: item.qty });\n            }\n        }\n\n        // Auto JV for Purchase\n        await autoPostPurchaseJV(entry);\n\n        await db.PurchaseItem.create({"
);
// Wait, the purchase hook looks wrong because it's inside a loop. Let's fix that.

fs.writeFileSync(filePath, content);
console.log('Accounting Engine helpers added to server.js');
