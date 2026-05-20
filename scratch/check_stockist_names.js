// Quick check: list all stockists to confirm exact names before cleanup
require('dotenv').config({ path: '../.env' });
const db = require('../models');

(async () => {
    try {
        await db.sequelize.authenticate();
        const all = await db.Stockist.findAll({ attributes: ['id', 'name'], order: [['id','ASC']] });
        console.log('=== ALL STOCKISTS ===');
        all.forEach(s => console.log(`  ID: ${s.id} | NAME: ${s.name}`));
        console.log(`\nTotal: ${all.length}`);
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
})();
