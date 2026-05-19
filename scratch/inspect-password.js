const db = require('../models');

async function run() {
    try {
        await db.sequelize.authenticate();
        const stockist = await db.Stockist.findOne({ where: { loginId: 'EMY838978' } });
        if (stockist) {
            console.log(`Password: ${stockist.password}`);
        } else {
            console.log("Not found");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
