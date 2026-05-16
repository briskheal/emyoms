const db = require('../models');

async function addColumn() {
    try {
        await db.sequelize.query('ALTER TABLE "Stockists" ADD COLUMN IF NOT EXISTS "openingBalance" DOUBLE PRECISION DEFAULT 0;');
        console.log("Column openingBalance added successfully.");
    } catch (e) {
        console.error("Failed to add column:", e.message);
    }
    process.exit(0);
}

addColumn();
