const db = require('../models');

async function checkCounters() {
    try {
        const company = await db.Company.findOne();
        if (!company) {
            console.log("No company found.");
            return;
        }
        console.log("Current Company Counters:");
        console.log(JSON.stringify(company.documentCounters, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkCounters();
