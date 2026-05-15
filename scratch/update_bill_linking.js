const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add pending-bills endpoint
const stockistGetRoute = "app.get('/api/admin/stockists', async (req, res) => {";
const pendingBillsEndpoint = `
app.get('/api/admin/stockists/:id/pending-bills', async (req, res) => {
    try {
        const { id } = req.params;
        const stockist = await db.Stockist.findByPk(id);
        if (!stockist) return res.status(404).json({ error: 'Stockist not found' });

        let pendingInvoices = [];
        let pendingPurchases = [];

        if (stockist.type === 'STOCKIST' || stockist.type === 'CUSTOMER') {
            pendingInvoices = await db.Invoice.findAll({
                where: { stockistId: id, outstandingAmount: { [db.Sequelize.Op.gt]: 0 } },
                order: [['createdAt', 'ASC']]
            });
        } else {
            pendingPurchases = await db.PurchaseEntry.findAll({
                where: { supplierId: id, outstandingAmount: { [db.Sequelize.Op.gt]: 0 } },
                order: [['createdAt', 'ASC']]
            });
        }
        res.json({ success: true, invoices: pendingInvoices, purchases: pendingPurchases });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
`;
content = content.replace(stockistGetRoute, pendingBillsEndpoint + "\n" + stockistGetRoute);

// 2. Update PurchaseEntry.create (near line 1717)
const purchaseCreateOld = `        const entry = await db.PurchaseEntry.create({
            purchaseNo: finalPurchaseNo,
            supplierId: supplierId || null,
            supplierInvoiceNo: req.body.supplierInvoiceNo || '',
            invoiceDate: date ? new Date(date) : new Date(),
            paymentMode: paymentMode || 'CREDIT',
            remarks: remarks || '',
            subTotal,
            gstAmount,
            otherChargesTotal: req.body.otherChargesTotal || 0,
            additionalCharges: req.body.additionalCharges || [],
            grandTotal
        });`;
const purchaseCreateNew = `        const entry = await db.PurchaseEntry.create({
            purchaseNo: finalPurchaseNo,
            supplierId: supplierId || null,
            supplierInvoiceNo: req.body.supplierInvoiceNo || '',
            invoiceDate: date ? new Date(date) : new Date(),
            paymentMode: paymentMode || 'CREDIT',
            remarks: remarks || '',
            subTotal,
            gstAmount,
            otherChargesTotal: req.body.otherChargesTotal || 0,
            additionalCharges: req.body.additionalCharges || [],
            grandTotal,
            outstandingAmount: grandTotal
        });`;
content = content.replace(purchaseCreateOld, purchaseCreateNew);

// 3. Update Invoice.create in direct-sale (near line 1359)
const invoiceCreateOld = `        const newInvoice = await db.Invoice.create({
            invoiceNo,
            orderId: newOrder.id,
            stockistId,
            subTotal,
            gstAmount,
            otherChargesTotal: otherChargesTotal || 0,
            grandTotal,
            additionalCharges: additionalCharges || [],
            placeOfSupply: req.body.placeOfSupply || 'Telangana',
            date: date || new Date()
        });`;
const invoiceCreateNew = `        const newInvoice = await db.Invoice.create({
            invoiceNo,
            orderId: newOrder.id,
            stockistId,
            subTotal,
            gstAmount,
            otherChargesTotal: otherChargesTotal || 0,
            grandTotal,
            outstandingAmount: grandTotal,
            additionalCharges: additionalCharges || [],
            placeOfSupply: req.body.placeOfSupply || 'Telangana',
            date: date || new Date()
        });`;
content = content.replace(invoiceCreateOld, invoiceCreateNew);

// 4. Update Payment POST (near line 2320)
const paymentOldCode = `app.post('/api/admin/payments', async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { party, amount, method, type, date } = req.body;
        const partyId = party; 
        
        const paymentNo = await getNextDocNo(type === 'RECEIPT' ? 'payin' : 'payout');

        const numAmount = Number(amount) || 0;
        const payment = await db.Payment.create({
            paymentNo,
            stockistId: partyId,
            amount: numAmount,
            method,
            type,
            date: date || new Date()
        }, { transaction: t });

        const stockist = await db.Stockist.findByPk(partyId, { transaction: t });
        
        // Auto JV
        await autoPostPaymentJV(payment, stockist, t);

        const adj = type === 'RECEIPT' ? -numAmount : numAmount;
        if (stockist) {
            stockist.outstandingBalance = Number(stockist.outstandingBalance) + adj;
            await stockist.save({ transaction: t });
        }

        await t.commit();
        res.json({ success: true, payment });
    } catch (e) {
        await t.rollback();
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});`;

const paymentNewCode = `app.post('/api/admin/payments', async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { party, amount, method, type, date, linkedBills } = req.body;
        const partyId = party; 
        
        const paymentNo = await getNextDocNo(type === 'RECEIPT' ? 'payin' : 'payout');

        const numAmount = Number(amount) || 0;
        const payment = await db.Payment.create({
            paymentNo,
            stockistId: partyId,
            amount: numAmount,
            method,
            type,
            date: date || new Date()
        }, { transaction: t });

        const stockist = await db.Stockist.findByPk(partyId, { transaction: t });
        
        // Auto JV
        await autoPostPaymentJV(payment, stockist, t);

        const adj = type === 'RECEIPT' ? -numAmount : numAmount;
        if (stockist) {
            stockist.outstandingBalance = Number(stockist.outstandingBalance) + adj;
            await stockist.save({ transaction: t });
        }

        // Link bills
        if (linkedBills && Array.isArray(linkedBills)) {
            for (const link of linkedBills) {
                const linkAmt = Number(link.amount) || 0;
                if (linkAmt <= 0) continue;

                await db.PaymentLink.create({
                    paymentId: payment.id,
                    invoiceId: link.invoiceId || null,
                    purchaseEntryId: link.purchaseEntryId || null,
                    amount: linkAmt
                }, { transaction: t });

                if (link.invoiceId) {
                    const inv = await db.Invoice.findByPk(link.invoiceId, { transaction: t });
                    if (inv) {
                        inv.outstandingAmount = Number(inv.outstandingAmount) - linkAmt;
                        await inv.save({ transaction: t });
                    }
                } else if (link.purchaseEntryId) {
                    const pur = await db.PurchaseEntry.findByPk(link.purchaseEntryId, { transaction: t });
                    if (pur) {
                        pur.outstandingAmount = Number(pur.outstandingAmount) - linkAmt;
                        await pur.save({ transaction: t });
                    }
                }
            }
        }

        await t.commit();
        res.json({ success: true, payment });
    } catch (e) {
        await t.rollback();
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});`;
content = content.replace(paymentOldCode, paymentNewCode);

fs.writeFileSync(path, content);
console.log("SUCCESS: server.js updated with bill linking logic.");
