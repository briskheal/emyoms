const mongoose = require('mongoose');

async function checkMissingPurchase() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const doc = await mongoose.connection.db.collection('purchaseentries').findOne({ _id: new mongoose.Types.ObjectId('69ec95b64f770eb0e57f7fa1') });
        console.log('\n--- Missing Purchase Entry Document ---');
        console.log(JSON.stringify(doc, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkMissingPurchase();
