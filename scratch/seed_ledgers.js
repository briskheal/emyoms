const db = require('../models');
async function go() {
    await db.Ledger.sync({ alter: true });
    const defaults = [
        { name: 'Cash Account',         group: 'Cash',            nature: 'DR' },
        { name: 'Petty Cash',           group: 'Cash',            nature: 'DR' },
        { name: 'Bank Account (HDFC)',  group: 'Bank',            nature: 'DR' },
        { name: 'Bank Account (SBI)',   group: 'Bank',            nature: 'DR' },
        { name: 'Owners Capital',       group: 'Capital',         nature: 'CR' },
        { name: 'Owners Drawings',      group: 'Capital',         nature: 'DR' },
        { name: 'Business Loan',        group: 'Loan',            nature: 'CR' },
        { name: 'GST Payable',          group: 'Tax Payable',     nature: 'CR' },
        { name: 'TDS Payable',          group: 'Tax Payable',     nature: 'CR' },
        { name: 'Opening Stock',        group: 'Stock',           nature: 'DR' },
        { name: 'Sundry Creditor',      group: 'Sundry Creditor', nature: 'CR' },
        { name: 'Sundry Debtor',        group: 'Sundry Debtor',   nature: 'DR' },
    ];
    let created = 0;
    for (const l of defaults) {
        const [, built] = await db.Ledger.findOrCreate({ where: { name: l.name }, defaults: l });
        if (built) created++;
    }
    console.log('Synced. Created:', created, 'default ledgers.');
    process.exit();
}
go();
