const db = require('../models');

async function run() {
    console.log("🔍 Looking up stockist in Neon DB...");
    try {
        await db.sequelize.authenticate();
        const stockist = await db.Stockist.findOne({ where: { loginId: 'EMY838978' } });
        if (stockist) {
            console.log(`✅ Stockist found!`);
            console.log(`  - ID:       ${stockist.id}`);
            console.log(`  - Login ID: ${stockist.loginId}`);
            console.log(`  - Name:     ${stockist.name}`);
        } else {
            console.log("❌ Stockist EMY838978 not found. Listing first 10 stockists:");
            const list = await db.Stockist.findAll({ limit: 10 });
            list.forEach(s => {
                console.log(`  - ID: ${s.id} | Login ID: ${s.loginId} | Name: ${s.name}`);
            });
        }
    } catch (e) {
        console.error("❌ DB Query Error:", e);
    }
    process.exit(0);
}

run();
