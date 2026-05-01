const mongoose = require('mongoose');
const db = require('./models');

async function migrateStockists() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        const MongoStockist = mongoose.model('Stockist', new mongoose.Schema({}, { strict: false }));
        const mongoStockists = await MongoStockist.find();
        
        console.log(`🔄 Migrating ${mongoStockists.length} Stockists...`);

        for (const ms of mongoStockists) {
            const data = ms.toObject();
            
            const sqlData = {
                name: data.name,
                loginId: data.loginId,
                password: data.password,
                address: data.address,
                phone: data.phone,
                email: data.email,
                dlNo: data.dlNo,
                gstNo: data.gstNo,
                fssaiNo: data.fssaiNo,
                panNo: data.panNo,
                city: data.city,
                state: data.state,
                pincode: data.pincode,
                approved: data.approved !== undefined ? data.approved : true,
                outstandingBalance: data.outstandingBalance || 0,
                negotiatedPrices: data.negotiatedPrices || []
            };

            const [stockist, created] = await db.Stockist.findOrCreate({
                where: { loginId: data.loginId },
                defaults: sqlData
            });

            if (!created) {
                await stockist.update(sqlData);
            }
        }

        console.log('✅ Stockists Migrated Successfully');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

migrateStockists();
