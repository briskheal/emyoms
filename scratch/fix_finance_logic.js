const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replacement for /api/admin/financial-statements
const newFinancialStatementsLogic = `app.get('/api/admin/financial-statements', async (req, res) => {
    try {
        const { from, to } = req.query;
        const [ledgers, stockists, expCats, lines] = await Promise.all([
            db.Ledger.findAll(),
            db.Stockist.findAll(),
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

        const getNetBal = (type, id, nature) => {
            let dr = 0, cr = 0;
            if (type === 'Ledger') {
                const l = ledgers.find(x => x.id === id);
                if (l.nature === 'DR') dr += Number(l.openingBalance || 0);
                else cr += Number(l.openingBalance || 0);
            }
            lines.filter(x => x.entityType === type && x.entityId === id).forEach(line => {
                if (!dateFilter(line)) return;
                if (line.type === 'DR') dr += Number(line.amount);
                else cr += Number(line.amount);
            });
            return dr - cr;
        };

        const income = [];
        const expenses = [];
        const assets = [];
        const liabilities = [];

        // 1. Process All Ledgers
        ledgers.forEach(l => {
            const bal = getNetBal('Ledger', l.id, l.nature);
            if (bal === 0) return;

            const grp = (l.group || '').toUpperCase();
            // Income Detection
            if (l.nature === 'CR' && (grp.includes('INCOME') || grp.includes('REVENUE') || grp.includes('SALES'))) {
                income.push({ name: l.name, amount: Math.abs(bal) });
            } 
            // Expense Detection
            else if (l.nature === 'DR' && (grp.includes('EXPENSE') || grp.includes('COST') || grp.includes('PURCHASE'))) {
                expenses.push({ name: l.name, amount: Math.abs(bal) });
            }
            // Balance Sheet Items
            else {
                if (bal > 0) assets.push({ name: l.name, amount: Math.abs(bal) });
                else liabilities.push({ name: l.name, amount: Math.abs(bal) });
            }
        });

        // 2. Process Expense Categories (Explicitly P&L)
        expCats.forEach(c => {
            const bal = getNetBal('ExpenseCategory', c.id, 'DR');
            if (bal !== 0) expenses.push({ name: c.name, amount: Math.abs(bal) });
        });

        // 3. Process Stockists (Explicitly Balance Sheet)
        stockists.forEach(s => {
            const bal = getNetBal('Stockist', s.id, 'DR');
            if (bal === 0) return;
            if (bal > 0) assets.push({ name: \`Debtor: \${s.name}\`, amount: Math.abs(bal) });
            else liabilities.push({ name: \`Creditor: \${s.name}\`, amount: Math.abs(bal) });
        });

        const totalIncome = income.reduce((s, x) => s + x.amount, 0);
        const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
        const netProfit = totalIncome - totalExpenses;

        // Add Net Profit to Liabilities (Equity section)
        liabilities.push({ name: 'Net Profit / Loss (Selected Period)', amount: netProfit });

        res.json({
            success: true,
            pl: { income, expenses, totalIncome, totalExpenses, netProfit },
            bs: { assets, liabilities, totalAssets: assets.reduce((s,x)=>s+x.amount,0), totalLiabilities: liabilities.reduce((s,x)=>s+x.amount,0) }
        });

    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});`;

// Find the start and end of the old block
const startStr = "app.get('/api/admin/financial-statements'";
const endStr = "app.get('/api/admin/trial-balance'";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const updatedContent = content.substring(0, startIdx) + newFinancialStatementsLogic + "\n\n\n" + content.substring(endIdx);
    fs.writeFileSync(filePath, updatedContent);
    console.log('Successfully updated financial statement logic in server.js');
} else {
    console.log('Could not find the target code block in server.js');
}
