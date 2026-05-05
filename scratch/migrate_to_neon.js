
const { Sequelize, DataTypes } = require('sequelize');
const pg = require('pg');

// OLD DATABASE (Render)
const OLD_DB_URL = "postgresql://admin:mwTkhylFpQ7Fo1vbNeVpv2pSd7gAtmWX@dpg-d7qfeh1j2pic73b6of1g-a.singapore-postgres.render.com/emyoms?ssl=true";

// NEW DATABASE (Neon) - Using IP but adding SNI hostname for routing
const NEON_HOST = "ep-green-mountain-aonjketm-pooler.c-2.ap-southeast-1.aws.neon.tech";
const NEON_IP = "13.251.17.193";
const NEON_USER = "neondb_owner";
const NEON_PASS = "npg_bqJ3wQE8GWuX";
const NEON_DB = "neondb";

async function migrate() {
    console.log("🚀 Starting Migration to Neon...");

    try {
        console.log(`📍 Connecting to Neon at ${NEON_IP} (SNI: ${NEON_HOST})...`);

        const oldSeq = new Sequelize(OLD_DB_URL, { 
            dialect: 'postgres', 
            logging: false, 
            dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } 
        });

        const newSeq = new Sequelize(`postgresql://${NEON_USER}:${NEON_PASS}@${NEON_IP}/${NEON_DB}`, {
            dialect: 'postgres',
            logging: false,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false,
                    servername: NEON_HOST // CRITICAL: This allows Neon to route the IP connection correctly
                }
            }
        });

        // Test connections
        await oldSeq.authenticate();
        console.log("✅ Connected to Old DB (Render)");
        
        await newSeq.authenticate();
        console.log("✅ Connected to New DB (Neon)");

        // Import models
        const models = [
            'Company', 'Category', 'Group', 'HSN', 'GST', 'HQ', 'ExpenseCategory', 'Media',
            'Stockist', 'Product', 'Batch', 'Expense', 'PurchaseEntry', 'PurchaseItem',
            'Order', 'OrderItem', 'Invoice', 'InvoiceItem', 'FinancialNote', 'NoteItem',
            'Payment', 'PDCNClaim', 'PDCNClaimItem'
        ];

        const dbOld = {};
        const dbNew = {};

        models.forEach(m => {
            const modelFn = require(`../models/${m.charAt(0).toLowerCase() + m.slice(1)}`);
            dbOld[m] = modelFn(oldSeq, DataTypes);
            dbNew[m] = modelFn(newSeq, DataTypes);
        });

        console.log("📦 Syncing New Database Schema...");
        await newSeq.sync({ force: true });
        console.log("✅ Schema Synced.");

        for (const m of models) {
            console.log(`⏳ Migrating ${m}...`);
            const data = await dbOld[m].findAll({ raw: true });
            if (data.length > 0) {
                await dbNew[m].bulkCreate(data);
                console.log(`✅ ${m}: ${data.length} records moved.`);
            } else {
                console.log(`➖ ${m}: No records found.`);
            }
        }

        console.log("\n✨ MIGRATION COMPLETED SUCCESSFULLY!");
        
        await oldSeq.close();
        await newSeq.close();

    } catch (error) {
        console.error("❌ Migration Failed:");
        console.error(error);
    }
}

migrate();
