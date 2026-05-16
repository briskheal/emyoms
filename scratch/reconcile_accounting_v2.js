const db = require('../models');

async function reconcile() {
    console.log("Starting Accounting Reconciliation...");

    const invoices = await db.Invoice.findAll();
    const purchases = await db.PurchaseEntry.findAll();
    const pdcns = await db.FinancialNote.findAll();

    const jvs = await db.JournalVoucher.findAll();
    const existingRefIds = jvs.map(j => j.refType + '-' + j.refId);

    const salesLedger = await db.Ledger.findOne({ where: { name: 'Sales Account' } });
    const purchaseLedger = await db.Ledger.findOne({ where: { name: 'Purchase Account' } });

    // Helper for generating JVs
    async function postJV(refType, refId, date, amount, narration, drLines, crLines) {
        const refKey = refType + '-' + refId;
        if (existingRefIds.indexOf(refKey) !== -1) {
            console.log("Skipping already posted: " + refKey);
            return;
        }

        const t = await db.sequelize.transaction();
        try {
            const jvNo = 'AUTO-SYNC-' + Date.now().toString().slice(-6);
            const jv = await db.JournalVoucher.create({
                jvNo: jvNo,
                date: date,
                narration: narration,
                totalAmount: amount,
                refType: refType,
                refId: refId
            }, { transaction: t });

            const lines = [];
            drLines.forEach(l => {
                lines.push({ 
                    jvId: jv.id, 
                    type: 'DR', 
                    amount: l.amount, 
                    entityType: l.entityType, 
                    entityId: l.entityId, 
                    entityName: l.entityName 
                });
            });
            crLines.forEach(l => {
                lines.push({ 
                    jvId: jv.id, 
                    type: 'CR', 
                    amount: l.amount, 
                    entityType: l.entityType, 
                    entityId: l.entityId, 
                    entityName: l.entityName 
                });
            });

            await db.JournalEntryLine.bulkCreate(lines, { transaction: t });
            await t.commit();
            console.log("Posted JV for " + refKey);
        } catch (e) {
            await t.rollback();
            console.error("Failed to post JV for " + refKey + ": " + e.message);
        }
    }

    // 1. Invoices
    for (const inv of invoices) {
        await postJV('Invoice', inv.id, inv.createdAt, inv.grandTotal, "Sales Invoice " + inv.invoiceNo,
            [{ amount: inv.grandTotal, entityType: 'Stockist', entityId: inv.stockistId, entityName: 'Stockist' }],
            [{ amount: inv.grandTotal, entityType: 'Ledger', entityId: salesLedger ? salesLedger.id : null, entityName: 'Sales Account' }]
        );
    }

    // 2. Purchases
    for (const pur of purchases) {
        await postJV('Purchase', pur.id, pur.invoiceDate || pur.createdAt, pur.grandTotal, "Purchase Bill " + (pur.supplierInvoiceNo || pur.purchaseNo),
            [{ amount: pur.grandTotal, entityType: 'Ledger', entityId: purchaseLedger ? purchaseLedger.id : null, entityName: 'Purchase Account' }],
            [{ amount: pur.grandTotal, entityType: 'Stockist', entityId: pur.supplierId, entityName: 'Supplier' }]
        );
    }

    // 3. PDCNs
    for (const note of pdcns) {
        const isCN = note.noteType === 'CN';
        await postJV('FinancialNote', note.id, note.createdAt, note.amount, (isCN ? 'Credit Note ' : 'Debit Note ') + note.noteNo,
            [{ amount: note.amount, entityType: 'Ledger', entityName: isCN ? 'Sales Returns' : 'Purchase Returns' }],
            [{ amount: note.amount, entityType: 'Stockist', entityId: note.stockistId, entityName: 'Party' }]
        );
    }

    console.log("Reconciliation finished.");
    process.exit(0);
}

reconcile();
