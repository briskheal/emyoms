const db = require('../models');

async function syncLedgers() {
    try {
        const standardLedgers = [
            { name: 'Sundry Debtor', nature: 'DR', group: 'Sundry Debtor' },
            { name: 'Sundry Creditor', nature: 'CR', group: 'Sundry Creditor' },
            { name: 'Sales Account', nature: 'CR', group: 'Income' },
            { name: 'Purchase Account', nature: 'DR', group: 'Expense' },
            { name: 'GST Payable', nature: 'CR', group: 'Tax Payable' },
            { name: 'Cash Account', nature: 'DR', group: 'Cash' },
            { name: 'Bank Account (HDFC)', nature: 'DR', group: 'Bank' },
            { name: 'Adjustment Account', nature: 'DR', group: 'General' }
        ];

        for (const l of standardLedgers) {
            const [ledger, created] = await db.Ledger.findOrCreate({
                where: { name: l.name },
                defaults: l
            });
            if (created) console.log(`Created ledger: ${l.name}`);
            else {
                // Ensure nature/group match
                ledger.nature = l.nature;
                ledger.group = l.group;
                await ledger.save();
                console.log(`Updated ledger: ${l.name}`);
            }
        }
        console.log('Ledger sync complete.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

syncLedgers();
