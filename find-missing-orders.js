const mongoose = require('mongoose');
const db = require('./models');
const dotenv = require('dotenv');
dotenv.config();

async function findMissingOrders() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    
    try {
        await mongoose.connect(mongoUri);
        const MongoOrder = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
        const mongoOrders = await MongoOrder.find();
        
        const sqlOrders = await db.Order.findAll();
        const sqlOrderNos = new Set(sqlOrders.map(o => o.orderNo));

        console.log('--- Missing Orders ---');
        for (const mo of mongoOrders) {
            if (!sqlOrderNos.has(mo.orderNo)) {
                console.log(`Missing OrderNo: ${mo.orderNo} | ID: ${mo._id} | Total: ${mo.grandTotal}`);
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

findMissingOrders();
