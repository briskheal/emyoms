const db = require('../models');

async function addMissingPurchaseRate() {
    console.log('--- Database Schema Update: Adding purchaseRate ---');
    
    try {
        await db.sequelize.authenticate();
        console.log('✅ Connected to database.');

        // Add purchaseRate to Batches table
        console.log('Attempting to add purchaseRate column to Batches table...');
        await db.sequelize.query('ALTER TABLE "Batches" ADD COLUMN IF NOT EXISTS "purchaseRate" DOUBLE PRECISION DEFAULT 0');
        console.log('✅ Column purchaseRate added to Batches table (or already existed).');

        // Verify Batches columns
        const [[batchCols]] = await db.sequelize.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'Batches\' AND column_name = \'purchaseRate\'');
        if (batchCols) {
            console.log('✅ Verification: purchaseRate exists in Batches table.');
        } else {
            console.log('❌ Verification FAILED: purchaseRate NOT found in Batches table.');
        }

        console.log('--- Update Complete ---');
    } catch (error) {
        console.error('❌ Update failed:', error.message);
    } finally {
        await db.sequelize.close();
    }
}

addMissingPurchaseRate();
