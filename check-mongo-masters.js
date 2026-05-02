const mongoose = require('mongoose');

async function checkMongoMasters() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const company = await mongoose.connection.db.collection('companies').findOne();
        console.log('\n--- MongoDB Company Details ---');
        console.log(JSON.stringify(company, null, 2));

        const collections = [
            'categories', 'groups', 'hsns', 'gsts', 'hqs', 'expensecategories', 'expensecategorys'
        ];

        console.log('\n--- MongoDB Master Counts ---');
        for (const coll of collections) {
            try {
                const count = await mongoose.connection.db.collection(coll).countDocuments();
                console.log(`${coll}: ${count}`);
                if (count > 0) {
                    const sample = await mongoose.connection.db.collection(coll).find().limit(2).toArray();
                    console.log(`  Sample ${coll}:`, JSON.stringify(sample, null, 2));
                }
            } catch (err) {}
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkMongoMasters();
