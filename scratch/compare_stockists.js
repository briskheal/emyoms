const mongoose = require('mongoose');
const db = require('../models');
const dotenv = require('dotenv');
path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function compareStockists() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const mongoStockists = await mongoose.connection.db.collection('stockists').find().toArray();
        console.log(`\n--- MongoDB Stockists (${mongoStockists.length}) ---`);
        mongoStockists.forEach(s => {
            console.log(`- ID: ${s._id}, loginId: ${s.loginId}, name: "${s.name}"`);
        });

        await db.sequelize.authenticate();
        console.log('\n✅ Connected to PostgreSQL');

        const sqlStockists = await db.Stockist.findAll();
        console.log(`\n--- PostgreSQL Stockists (${sqlStockists.length}) ---`);
        sqlStockists.forEach(s => {
            console.log(`- ID: ${s.id}, loginId: ${s.loginId}, name: "${s.name}"`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

compareStockists();
