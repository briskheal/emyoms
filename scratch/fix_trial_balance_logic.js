const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

const newTrialBalanceLogic = `app.get('/api/admin/trial-balance', async (req, res) => {
    try {
        const { from, to } = req.query;
        const [stockists, ledgers, expCats, lines] = await Promise.all([
            db.Stockist.findAll(),
            db.Ledger.findAll(),
            db.ExpenseCategory.findAll(),
            db.JournalEntryLine.findAll({
                include: [{ model: db.JournalVoucher, attributes: ['date'] }]
            })
        ]);

        const dateFilter = (line) => {
            if (!from && !to) return true;
            const d = new Date(line.JournalVoucher?.date || line.createdAt);
            if (from && d < new Date(from)) return false;
            if (to && d > new Date(to)) return false;
            return true;
        };

        const tb = [];

        // 1. Process Ledgers
        for (const l of ledgers) {
            let dr = 0, cr = 0;
            if (l.nature === 'DR') dr += Number(l.openingBalance || 0);
            else cr += Number(l.openingBalance || 0);

            const myLines = lines.filter(x => x.entityType === 'Ledger' && x.entityId === l.id);
            myLines.forEach(line => {
                if (!dateFilter(line)) return;
                if (line.type === 'DR') dr += Number(line.amount);
                else cr += Number(line.amount);
            });

            const net = dr - cr;
            if (net !== 0 || myLines.length > 0 || l.openingBalance > 0) {
                tb.push({
                    entityType: 'Ledger',
                    entityId: l.id,
                    name: l.name,
                    group: l.group,
                    dr: net > 0 ? net : 0,
                    cr: net < 0 ? Math.abs(net) : 0
                });
            }
        }

        // 2. Process Stockists
        for (const s of stockists) {
            let dr = 0, cr = 0;
            const myLines = lines.filter(x => x.entityType === 'Stockist' && x.entityId === s.id);
            myLines.forEach(line => {
                if (!dateFilter(line)) return;
                if (line.type === 'DR') dr += Number(line.amount);
                else cr += Number(line.amount);
            });
            const net = dr - cr;
            if (net !== 0 || myLines.length > 0) {
                tb.push({
                    entityType: 'Stockist',
                    entityId: s.id,
                    name: s.name,
                    group: 'Sundry Debtors / Creditors',
                    dr: net > 0 ? net : 0,
                    cr: net < 0 ? Math.abs(net) : 0
                });
            }
        }

        // 3. Process Expense Categories
        for (const c of expCats) {
            let dr = 0, cr = 0;
            const myLines = lines.filter(x => x.entityType === 'ExpenseCategory' && x.entityId === c.id);
            myLines.forEach(line => {
                if (!dateFilter(line)) return;
                if (line.type === 'DR') dr += Number(line.amount);
                else cr += Number(line.amount);
            });
            const net = dr - cr;
            if (net !== 0 || myLines.length > 0) {
                tb.push({
                    entityType: 'ExpenseCategory',
                    entityId: c.id,
                    name: c.name,
                    group: \`\${c.expenseType} Expenses\`,
                    dr: net > 0 ? net : 0,
                    cr: net < 0 ? Math.abs(net) : 0
                });
            }
        }

        res.json({ success: true, trialBalance: tb });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});`;

// Find the start and end of the trial balance block
const startStr = "app.get('/api/admin/trial-balance'";
const endStr = "app.get('/api/admin/ledger-statement'";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const updatedContent = content.substring(0, startIdx) + newTrialBalanceLogic + "\n\n\n" + content.substring(endIdx);
    fs.writeFileSync(filePath, updatedContent);
    console.log('Successfully updated trial balance logic in server.js');
} else {
    console.log('Could not find the target code block for trial balance in server.js');
}
