const db = require('../models');

async function checkLedgers() {
    try {
        const ledgers = await db.Ledger.findAll();
        console.log('--- ALL LEDGERS ---');
        ledgers.forEach(l => {
            console.log(`ID: ${l.id} | Name: ${l.name} | Nature: ${l.nature} | Group: ${l.group}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkLedgers();
