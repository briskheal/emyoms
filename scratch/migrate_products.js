const db = require('../models');

async function runMigration() {
    try {
        console.log("Connecting to database and syncing schema...");
        await db.sequelize.sync({ alter: true });
        console.log("Schema synchronized. Fields internalCode and barcode added.");
        
        console.log("Fetching all products...");
        const products = await db.Product.findAll({ order: [['id', 'ASC']] });
        
        let updateCount = 0;

        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            let needsUpdate = false;
            
            if (!p.internalCode) {
                const count = i + 1;
                p.internalCode = 'ITEM-' + String(count).padStart(4, '0');
                needsUpdate = true;
            }
            if (!p.barcode && p.internalCode) {
                p.barcode = p.internalCode;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await p.save();
                updateCount++;
                console.log(`Updated product ID ${p.id} with internalCode: ${p.internalCode}`);
            }
        }
        
        console.log(`Migration completed successfully. Updated ${updateCount} products.`);
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}

runMigration();
