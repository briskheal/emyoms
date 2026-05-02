const mongoose = require('mongoose');
const db = require('./models');
const dotenv = require('dotenv');
dotenv.config();

async function verifyMigration() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        console.log('Connecting to PostgreSQL...');
        await db.sequelize.authenticate();
        console.log('✅ PostgreSQL Connected');

        const models = [
            { name: 'Stockist', mongo: 'Stockist', mongoColl: 'stockists', sql: 'Stockist' },
            { name: 'Product', mongo: 'Product', mongoColl: 'products', sql: 'Product' },
            { name: 'Order', mongo: 'Order', mongoColl: 'orders', sql: 'Order' },
            { name: 'Purchase Entry', mongo: 'PurchaseEntry', mongoColl: 'purchaseentries', sql: 'PurchaseEntry' },
            { name: 'Invoice', mongo: 'Invoice', mongoColl: 'invoices', sql: 'Invoice' },
            { name: 'Financial Note', mongo: 'FinancialNote', mongoColl: 'financialnotes', sql: 'FinancialNote' },
            { name: 'Payment', mongo: 'Payment', mongoColl: 'payments', sql: 'Payment' },
            { name: 'Expense', mongo: 'Expense', mongoColl: 'expenses', sql: 'Expense' },
            { name: 'Category', mongo: 'Category', mongoColl: 'categories', sql: 'Category' },
            { name: 'Group', mongo: 'Group', mongoColl: 'groups', sql: 'Group' },
            { name: 'HSN', mongo: 'HSN', mongoColl: 'hsns', sql: 'HSN' },
            { name: 'GST', mongo: 'GST', mongoColl: 'gsts', sql: 'GST' },
            { name: 'HQ', mongo: 'HQ', mongoColl: 'hqs', sql: 'HQ' },
            { name: 'Expense Cat', mongo: 'ExpenseCategory', mongoColl: 'expensecategories', sql: 'ExpenseCategory' }
        ];

        console.log('\n--- Migration Status Comparison ---\n');
        console.log(`${'Model'.padEnd(20)} | ${'MongoDB'.padStart(10)} | ${'PostgreSQL'.padStart(10)} | ${'Status'}`);
        console.log('-'.repeat(60));

        for (const m of models) {
            let mongoCount = 0;
            try {
                // Use native collection access to avoid pluralization issues
                mongoCount = await mongoose.connection.db.collection(m.mongoColl).countDocuments();
            } catch (err) {
                // If it fails, maybe the collection name is different.
            }

            let sqlCount = 0;
            try {
                sqlCount = await db[m.sql].count();
            } catch (err) {
                // console.error(`Error counting SQL ${m.sql}:`, err.message);
            }

            const diff = mongoCount - sqlCount;
            const status = diff === 0 ? '✅ Match' : (diff > 0 ? `❌ Missing ${diff}` : `➕ Extra ${Math.abs(diff)}`);

            console.log(`${m.name.padEnd(20)} | ${mongoCount.toString().padStart(10)} | ${sqlCount.toString().padStart(10)} | ${status}`);
        }

        console.log('\n--- Done ---\n');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error during verification:', e);
        process.exit(1);
    }
}

verifyMigration();
