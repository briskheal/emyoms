const path = require('path');
const db = require(path.join(__dirname, '../models'));

async function checkJVs() {
    try {
        const jvs = await db.JournalVoucher.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [{ model: db.JournalEntryLine, as: 'lines' }]
        });

        if (jvs.length === 0) {
            console.log("No Journal Vouchers found.");
            return;
        }

        jvs.forEach(jv => {
            console.log(`[${jv.refType || 'Manual'}] JV: ${jv.jvNo}, Total: ${jv.totalAmount}`);
            if (jv.lines) {
                jv.lines.forEach(line => {
                    console.log(`  - ${line.type} ${line.entityName}: ₹${line.amount}`);
                });
            }
        });
    } catch (e) { console.error(e); }
}
checkJVs();
