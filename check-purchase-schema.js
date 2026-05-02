const mongoose = require('mongoose');

async function checkPurchaseSchema() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        const Purchase = mongoose.model('PurchaseEntry', new mongoose.Schema({}, { strict: false }));
        const one = await Purchase.findOne();
        console.log(JSON.stringify(one, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkPurchaseSchema();
