const db = require('../models');

async function checkConstraints() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected to database.');

        console.log('--- Product Table Constraints ---');
        const [prodConstraints] = await db.sequelize.query(`
            SELECT conname, contype, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE n.nspname = 'public' AND conrelid = '"Products"'::regclass;
        `);
        console.log(JSON.stringify(prodConstraints, null, 2));

        console.log('--- Batch Table Constraints ---');
        const [batchConstraints] = await db.sequelize.query(`
            SELECT conname, contype, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE n.nspname = 'public' AND conrelid = '"Batches"'::regclass;
        `);
        console.log(JSON.stringify(batchConstraints, null, 2));

    } catch (e) {
        console.error(e.message);
    } finally {
        await db.sequelize.close();
    }
}

checkConstraints();
