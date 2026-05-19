const db = require('../models');

async function fixSequences() {
    try {
        console.log('Fixing sequences in PostgreSQL...');
        const models = Object.keys(db).filter(k => db[k].tableName);
        for (const modelKey of models) {
            const model = db[modelKey];
            const tableName = model.tableName;
            const primaryKey = model.primaryKeyAttribute || 'id';
            
            // Check if table has a sequence
            const query = `
                SELECT pg_get_serial_sequence('"${tableName}"', '${primaryKey}') as seq;
            `;
            const [results] = await db.sequelize.query(query);
            const seqName = results[0]?.seq;
            
            if (seqName) {
                // Determine maximum value
                const [maxRes] = await db.sequelize.query(`SELECT MAX("${primaryKey}") as max_val FROM "${tableName}"`);
                const maxVal = maxRes[0]?.max_val;
                const nextVal = maxVal ? maxVal + 1 : 1;
                
                console.log(`Resetting sequence for ${tableName} (PK: ${primaryKey}) to ${nextVal}...`);
                const resetQuery = `
                    SELECT setval('${seqName}', ${nextVal}, false);
                `;
                await db.sequelize.query(resetQuery);
            }
        }
        console.log('✅ All sequences successfully reset!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error resetting sequences:', e);
        process.exit(1);
    }
}

fixSequences();
