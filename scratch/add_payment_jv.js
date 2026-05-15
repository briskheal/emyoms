const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let serverJS = fs.readFileSync(path, 'utf8');

const oldCode = `app.post('/api/admin/payments', async (req, res) => {
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
        });


        const stockist = await db.Stockist.findByPk(partyId);
        const adj = type === 'RECEIPT' ? -Number(amount) : Number(amount);
        if (stockist) await stockist.increment('outstandingBalance', { by: adj });

        res.json({ success: true, payment });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});`;

const newCode = `async function autoPostPaymentJV(payment, stockist, t) {
    let bankLedgerName = 'Cash Account';
    if (['Bank Transfer', 'UPI', 'Cheque'].includes(payment.method)) bankLedgerName = 'Bank Account (HDFC)';
    const bankLedger = await db.Ledger.findOne({ where: { name: bankLedgerName } });

    const jvNo = await getNextDocNo('jv');
    const isReceipt = payment.type === 'RECEIPT';

    const jv = await db.JournalVoucher.create({
        jvNo,
        date: payment.date || new Date(),
        narration: \`Auto JV: \${isReceipt ? 'Payment In' : 'Payment Out'} \${payment.paymentNo} \${isReceipt ? 'from' : 'to'} \${stockist ? stockist.name : 'Unknown Party'}\`,
        totalAmount: payment.amount,
        refType: 'Payment',
        refId: payment.id
    }, { transaction: t });

    await db.JournalEntryLine.bulkCreate([
        {
            jvId: jv.id,
            type: isReceipt ? 'DR' : 'CR',
            amount: payment.amount,
            entityType: 'Ledger',
            entityId: bankLedger ? bankLedger.id : null,
            entityName: bankLedgerName,
            notes: \`Paid via \${payment.method || 'Cash'}\`
        },
        {
            jvId: jv.id,
            type: isReceipt ? 'CR' : 'DR',
            amount: payment.amount,
            entityType: 'Stockist',
            entityId: stockist ? stockist.id : null,
            entityName: stockist ? stockist.name : 'Unknown Party',
            notes: \`\${isReceipt ? 'Receipt' : 'Payment'}\`
        }
    ], { transaction: t });
}

app.post('/api/admin/payments', async (req, res) => {
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

const startIdx = serverJS.indexOf("app.post('/api/admin/payments'");
const endStr = "});";
const firstSubstr = serverJS.substring(startIdx);
const endIdxLocal = firstSubstr.indexOf(endStr);
const endIdx = startIdx + endIdxLocal + endStr.length;

if (startIdx !== -1 && endIdxLocal !== -1) {
    serverJS = serverJS.substring(0, startIdx) + newCode + serverJS.substring(endIdx);
    fs.writeFileSync(path, serverJS);
    console.log("SUCCESS: Replaced via index.");
} else {
    console.log("Failed. start:", startIdx, "endLocal:", endIdxLocal);
}
