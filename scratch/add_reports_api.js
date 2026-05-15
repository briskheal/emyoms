const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let serverJS = fs.readFileSync(path, 'utf8');

const newEndpoints = `
// --- FINANCIAL REPORTS (Trial Balance & Ledger Statement) ---

app.get('/api/admin/trial-balance', async (req, res) => {
    try {
        const [stockists, ledgers, expCats, lines] = await Promise.all([
            db.Stockist.findAll({ attributes: ['id', 'name', 'outstandingBalance'] }),
            db.Ledger.findAll({ attributes: ['id', 'name', 'group', 'nature', 'openingBalance'] }),
            db.ExpenseCategory.findAll({ attributes: ['id', 'name', 'expenseType'] }),
            db.JournalEntryLine.findAll()
        ]);

        const tb = [];

        // 1. Process Ledgers
        for (const l of ledgers) {
            let dr = 0, cr = 0;
            if (l.nature === 'DR') dr += Number(l.openingBalance || 0);
            else cr += Number(l.openingBalance || 0);

            const myLines = lines.filter(x => x.entityType === 'Ledger' && x.entityId === l.id);
            myLines.forEach(line => {
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
});

app.get('/api/admin/ledger-statement', async (req, res) => {
    try {
        const { type, id } = req.query;
        if (!type || !id) return res.status(400).json({ error: 'Missing type or id' });

        const lines = await db.JournalEntryLine.findAll({
            where: { entityType: type, entityId: id },
            include: [{ model: db.JournalVoucher, as: 'voucher' }],
            order: [[{ model: db.JournalVoucher, as: 'voucher' }, 'date', 'ASC']]
        });

        // Determine Opening Balance
        let ob = 0;
        let obType = 'DR';
        if (type === 'Ledger') {
            const l = await db.Ledger.findByPk(id);
            if (l) {
                ob = Number(l.openingBalance || 0);
                obType = l.nature;
            }
        }

        res.json({ success: true, openingBalance: ob, obType, lines });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
`;

const insertMarker = "// --- JOURNAL ENTRIES (JV) ---";
if (serverJS.includes(insertMarker)) {
    serverJS = serverJS.replace(insertMarker, insertMarker + "\n" + newEndpoints);
    fs.writeFileSync(path, serverJS);
    console.log("SUCCESS: Reports API added.");
} else {
    console.log("Failed to find JV marker.");
}
