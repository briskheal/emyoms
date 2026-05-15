const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let serverJS = fs.readFileSync(path, 'utf8');

const oldCode = `app.post('/api/admin/expenses', async (req, res) => {
    try {
        const expenseNo = await getNextDocNo('expense');
        const expense = await db.Expense.create({
            ...req.body,
            amount: Number(req.body.amount) || 0,
            expenseNo
        });

        res.json({ success: true, expense });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/admin/expenses/:id', async (req, res) => {
    try {
        const expense = await db.Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
        await expense.update({
            type:          req.body.type          || expense.type,
            categoryName:  req.body.categoryName  || expense.categoryName,
            title:         req.body.title         || expense.title,
            date:          req.body.date          || expense.date,
            amount:        Number(req.body.amount) || expense.amount,
            paymentMethod: req.body.paymentMethod || expense.paymentMethod,
            notes:         req.body.notes         !== undefined ? req.body.notes : expense.notes
        });
        res.json({ success: true, expense });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/admin/expenses/:id', async (req, res) => {
    try {
        const expense = await db.Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
        await expense.destroy();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});`;

const newCode = `async function autoPostExpenseJV(expense, t) {
    const expCat = await db.ExpenseCategory.findOne({ where: { name: expense.categoryName } });
    
    let crLedgerName = 'Cash Account';
    if (['Bank Transfer', 'UPI', 'Cheque'].includes(expense.paymentMethod)) crLedgerName = 'Bank Account (HDFC)';
    const crLedger = await db.Ledger.findOne({ where: { name: crLedgerName } });

    const jvNo = await getNextDocNo('jv');
    const jv = await db.JournalVoucher.create({
        jvNo,
        date: expense.date || new Date(),
        narration: \`Auto JV: Expense \${expense.expenseNo} - \${expense.title || expense.categoryName}\`,
        totalAmount: expense.amount,
        refType: 'Expense',
        refId: expense.id
    }, { transaction: t });

    await db.JournalEntryLine.bulkCreate([
        {
            jvId: jv.id,
            type: 'DR',
            amount: expense.amount,
            entityType: 'ExpenseCategory',
            entityId: expCat ? expCat.id : null,
            entityName: expense.categoryName,
            notes: expense.title || ''
        },
        {
            jvId: jv.id,
            type: 'CR',
            amount: expense.amount,
            entityType: 'Ledger',
            entityId: crLedger ? crLedger.id : null,
            entityName: crLedgerName,
            notes: \`Paid via \${expense.paymentMethod || 'Cash'}\`
        }
    ], { transaction: t });
}

app.post('/api/admin/expenses', async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const expenseNo = await getNextDocNo('expense');
        const expense = await db.Expense.create({
            ...req.body,
            amount: Number(req.body.amount) || 0,
            expenseNo
        }, { transaction: t });

        await autoPostExpenseJV(expense, t);

        await t.commit();
        res.json({ success: true, expense });
    } catch (e) { 
        await t.rollback();
        res.status(500).json({ success: false, error: e.message }); 
    }
});

app.put('/api/admin/expenses/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const expense = await db.Expense.findByPk(req.params.id, { transaction: t });
        if (!expense) throw new Error('Expense not found');
        
        await expense.update({
            type:          req.body.type          || expense.type,
            categoryName:  req.body.categoryName  || expense.categoryName,
            title:         req.body.title         || expense.title,
            date:          req.body.date          || expense.date,
            amount:        Number(req.body.amount) || expense.amount,
            paymentMethod: req.body.paymentMethod || expense.paymentMethod,
            notes:         req.body.notes         !== undefined ? req.body.notes : expense.notes
        }, { transaction: t });

        const oldJv = await db.JournalVoucher.findOne({ where: { refType: 'Expense', refId: expense.id }, transaction: t });
        if (oldJv) {
            await db.JournalEntryLine.destroy({ where: { jvId: oldJv.id }, transaction: t });
            await oldJv.destroy({ transaction: t });
        }
        await autoPostExpenseJV(expense, t);

        await t.commit();
        res.json({ success: true, expense });
    } catch (e) { 
        await t.rollback();
        res.status(500).json({ success: false, error: e.message }); 
    }
});

app.delete('/api/admin/expenses/:id', async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const expense = await db.Expense.findByPk(req.params.id, { transaction: t });
        if (!expense) throw new Error('Expense not found');
        
        const oldJv = await db.JournalVoucher.findOne({ where: { refType: 'Expense', refId: expense.id }, transaction: t });
        if (oldJv) {
            await db.JournalEntryLine.destroy({ where: { jvId: oldJv.id }, transaction: t });
            await oldJv.destroy({ transaction: t });
        }

        await expense.destroy({ transaction: t });

        await t.commit();
        res.json({ success: true });
    } catch (e) { 
        await t.rollback();
        res.status(500).json({ success: false, error: e.message }); 
    }
});`;

if (serverJS.includes(oldCode)) {
    serverJS = serverJS.replace(oldCode, newCode);
    fs.writeFileSync(path, serverJS);
    console.log("SUCCESS: Expense routes updated for Auto-JV");
} else {
    console.log("ERROR: Could not find exact code to replace.");
}
