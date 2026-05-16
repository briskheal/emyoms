const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Helper Functions
const helpers = `
async function autoPostInvoiceJV(invoice, t) {
    const salesLedger = await db.Ledger.findOne({ where: { name: 'Sales Account' } });
    const jvNo = await getNextDocNo('jv');
    const jv = await db.JournalVoucher.create({
        jvNo, date: invoice.createdAt, narration: \`Sales Invoice \${invoice.invoiceNo}\`, totalAmount: invoice.grandTotal, refType: 'Invoice', refId: invoice.id
    }, { transaction: t });
    await db.JournalEntryLine.bulkCreate([
        { jvId: jv.id, type: 'DR', amount: invoice.grandTotal, entityType: 'Stockist', entityId: invoice.stockistId, entityName: 'Stockist', notes: 'Sales' },
        { jvId: jv.id, type: 'CR', amount: invoice.grandTotal, entityType: 'Ledger', entityId: salesLedger ? salesLedger.id : null, entityName: 'Sales Account', notes: 'Revenue' }
    ], { transaction: t });
}

async function autoPostPurchaseJV(purchase, t) {
    const purchaseLedger = await db.Ledger.findOne({ where: { name: 'Purchase Account' } });
    const jvNo = await getNextDocNo('jv');
    const jv = await db.JournalVoucher.create({
        jvNo, date: purchase.invoiceDate || purchase.createdAt, narration: \`Purchase Bill \${purchase.supplierInvoiceNo || purchase.purchaseNo}\`, totalAmount: purchase.grandTotal, refType: 'Purchase', refId: purchase.id
    }, { transaction: t });
    await db.JournalEntryLine.bulkCreate([
        { jvId: jv.id, type: 'DR', amount: purchase.grandTotal, entityType: 'Ledger', entityId: purchaseLedger ? purchaseLedger.id : null, entityName: 'Purchase Account', notes: 'Inventory Inward' },
        { jvId: jv.id, type: 'CR', amount: purchase.grandTotal, entityType: 'Stockist', entityId: purchase.supplierId, entityName: 'Supplier', notes: 'Credit Purchase' }
    ], { transaction: t });
}

async function autoPostNoteJV(note, t) {
    const jvNo = await getNextDocNo('jv');
    const isCN = note.noteType === 'CN';
    const jv = await db.JournalVoucher.create({
        jvNo, date: note.createdAt, narration: \`\${isCN ? 'Credit Note' : 'Debit Note'} \${note.noteNo} - \${note.reason}\`, totalAmount: note.amount, refType: 'FinancialNote', refId: note.id
    }, { transaction: t });
    await db.JournalEntryLine.bulkCreate([
        { jvId: jv.id, type: isCN ? 'DR' : 'CR', amount: note.amount, entityType: 'Ledger', entityName: isCN ? 'Sales Returns' : 'Purchase Returns', notes: note.reason },
        { jvId: jv.id, type: isCN ? 'CR' : 'DR', amount: note.amount, entityType: 'Stockist', entityId: note.stockistId, entityName: 'Party', notes: 'Adjustment' }
    ], { transaction: t });
}
`;

if (!content.includes('function autoPostInvoiceJV')) {
    const pos = content.indexOf('async function autoPostPaymentJV');
    content = content.substring(0, pos) + helpers + "\n" + content.substring(pos);
}

// 2. Hook Invoice (Generate from Order)
content = content.replace(
    "await order.update({ status: 'invoiced' });",
    "const tInv = await db.sequelize.transaction();\n        await order.update({ status: 'invoiced' }, { transaction: tInv });\n        await autoPostInvoiceJV(newInvoice, tInv);\n        await tInv.commit();"
);

// 3. Hook Purchase Creation
content = content.replace(
    "const entry = await db.PurchaseEntry.create({",
    "const tPur = await db.sequelize.transaction();\n        const entry = await db.PurchaseEntry.create({"
);
content = content.replace(
    "grandTotal\n        });",
    "grandTotal\n        }, { transaction: tPur });"
);
// This is getting messy with manual replacements. I'll use a more surgical approach.

fs.writeFileSync(filePath, content);
