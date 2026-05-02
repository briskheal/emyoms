const mongoose = require('mongoose');

async function checkLatestPurchase() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        const Purchase = mongoose.model('PurchaseEntry', new mongoose.Schema({}, { strict: false }));
        const latest = await Purchase.findOne().sort({ createdAt: -1 });
        console.log(JSON.stringify(latest, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkLatestPurchase();
