const mongoose = require('mongoose');

async function listCollections() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('--- MongoDB Collections ---');
        collections.forEach(c => console.log(c.name));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listCollections();
