const path = require('path');
const db = require(path.join(__dirname, '../models'));

async function checkLedgers() {
    try {
        const ledgers = await db.Ledger.findAll();
        console.log("Existing Ledgers:");
        ledgers.forEach(l => {
            console.log(`- ${l.name} (${l.groupName})`);
        });
    } catch (e) {
        console.error("Error checking ledgers:", e);
    }
}

checkLedgers();
