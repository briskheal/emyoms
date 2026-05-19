const mongoose = require('mongoose');
const db = require('../models');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function compareProducts() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const mongoProds = await mongoose.connection.db.collection('products').find().toArray();
        console.log(`\n--- MongoDB Products (${mongoProds.length}) ---`);
        const mongoNames = mongoProds.map(p => p.name.trim().toUpperCase());

        await db.sequelize.authenticate();
        console.log('\n✅ Connected to PostgreSQL');

        const sqlProds = await db.Product.findAll();
        console.log(`\n--- PostgreSQL Products (${sqlProds.length}) ---`);
        const sqlNames = sqlProds.map(p => p.name.trim().toUpperCase());

        console.log('\n--- Products in MongoDB but not in PostgreSQL ---');
        mongoProds.forEach(p => {
            const name = p.name.trim().toUpperCase();
            if (!sqlNames.includes(name)) {
                console.log(`- ID: ${p._id}, name: "${p.name}"`);
            }
        });

        console.log('\n--- Products in PostgreSQL but not in MongoDB ---');
        sqlProds.forEach(p => {
            const name = p.name.trim().toUpperCase();
            if (!mongoNames.includes(name)) {
                console.log(`- ID: ${p.id}, name: "${p.name}"`);
            }
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

compareProducts();
