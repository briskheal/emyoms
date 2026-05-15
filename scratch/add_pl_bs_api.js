const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let serverJS = fs.readFileSync(path, 'utf8');

const newEndpoint = `
app.get('/api/admin/financial-statements', async (req, res) => {
    try {
        const [ledgers, stockists, expCats, lines] = await Promise.all([
            db.Ledger.findAll(),
            db.Stockist.findAll(),
            db.ExpenseCategory.findAll(),
            db.JournalEntryLine.findAll()
        ]);

        const getNetBal = (type, id, nature) => {
            let dr = 0, cr = 0;
            if (type === 'Ledger') {
                const l = ledgers.find(x => x.id === id);
                if (l.nature === 'DR') dr += Number(l.openingBalance || 0);
                else cr += Number(l.openingBalance || 0);
            }
            lines.filter(x => x.entityType === type && x.entityId === id).forEach(line => {
                if (line.type === 'DR') dr += Number(line.amount);
                else cr += Number(line.amount);
            });
            return dr - cr;
        };

        // P&L
        const income = [];
        const expenses = [];
        
        // Sales
        const salesLedger = ledgers.find(x => x.name === 'Sales Account');
        if (salesLedger) {
            const bal = getNetBal('Ledger', salesLedger.id, 'CR');
            if (bal !== 0) income.push({ name: 'Sales Revenue', amount: Math.abs(bal) });
        }

        // Expenses
        expCats.forEach(c => {
            const bal = getNetBal('ExpenseCategory', c.id, 'DR');
            if (bal !== 0) expenses.push({ name: c.name, amount: Math.abs(bal) });
        });

        const totalIncome = income.reduce((s, x) => s + x.amount, 0);
        const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
        const netProfit = totalIncome - totalExpenses;

        // Balance Sheet
        const assets = [];
        const liabilities = [];

        ledgers.forEach(l => {
            if (l.name === 'Sales Account') return; // Income statement item
            const bal = getNetBal('Ledger', l.id, l.nature);
            if (bal === 0) return;

            if (['Bank', 'Cash', 'Stock', 'Fixed Assets'].includes(l.group)) {
                assets.push({ name: l.name, amount: Math.abs(bal), type: bal >= 0 ? 'DR' : 'CR' });
            } else {
                liabilities.push({ name: l.name, amount: Math.abs(bal), type: bal <= 0 ? 'CR' : 'DR' });
            }
        });

        // Add Stockists
        stockists.forEach(s => {
            const bal = getNetBal('Stockist', s.id, 'DR');
            if (bal === 0) return;
            if (bal > 0) assets.push({ name: \`Debtor: \${s.name}\`, amount: bal });
            else liabilities.push({ name: \`Creditor: \${s.name}\`, amount: Math.abs(bal) });
        });

        // Add Net Profit to Liabilities (as part of Capital)
        liabilities.push({ name: 'Net Profit (Current Year)', amount: netProfit });

        res.json({
            success: true,
            pl: { income, expenses, totalIncome, totalExpenses, netProfit },
            bs: { assets, liabilities, totalAssets: assets.reduce((s,x)=>s+x.amount,0), totalLiabilities: liabilities.reduce((s,x)=>s+x.amount,0) }
        });

    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
`;

const insertMarker = "// --- FINANCIAL REPORTS (Trial Balance & Ledger Statement) ---";
if (serverJS.includes(insertMarker)) {
    serverJS = serverJS.replace(insertMarker, insertMarker + "\n" + newEndpoint);
    fs.writeFileSync(path, serverJS);
    console.log("SUCCESS: Financial Statements API added.");
} else {
    console.log("Failed to find JV marker.");
}
