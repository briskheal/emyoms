const mongoose = require('mongoose');
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

const db = {
    Category: require('./models/category')(sequelize, DataTypes),
    Group: require('./models/group')(sequelize, DataTypes),
    HSN: require('./models/hsn')(sequelize, DataTypes),
    GST: require('./models/gst')(sequelize, DataTypes),
    HQ: require('./models/hq')(sequelize, DataTypes),
    ExpenseCategory: require('./models/expenseCategory')(sequelize, DataTypes)
};

async function migrate() {
    console.log('🔗 Connecting to MongoDB...');
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');

    await sequelize.authenticate();
    
    // Helper to migrate simple models
    const migrateModel = async (MongoModelName, SQLModel, mapping) => {
        const MongoModel = mongoose.model(MongoModelName, new mongoose.Schema({}, { strict: false }));
        const items = await MongoModel.find();
        console.log(`🔄 Migrating ${MongoModelName} (${items.length} records)...`);
        
        await SQLModel.destroy({ where: {}, truncate: true, cascade: true });
        
        for (const item of items) {
            const data = item.toObject();
            const sqlData = mapping(data);
            await SQLModel.create(sqlData);
        }
    };

    try {
        await migrateModel('Category', db.Category, (d) => ({ name: d.name }));
        await migrateModel('Group', db.Group, (d) => ({ name: d.name }));
        await migrateModel('HSN', db.HSN, (d) => ({ code: d.code, description: d.description }));
        await migrateModel('GST', db.GST, (d) => ({ rate: d.rate }));
        await migrateModel('HQ', db.HQ, (d) => ({ name: d.name, code: d.code }));
        await migrateModel('ExpenseCategory', db.ExpenseCategory, (d) => ({ 
            name: d.name, 
            type: d.type || 'Indirect' 
        }));

        console.log('✅ ALL MASTER DATA MIGRATED SUCCESSFULLY!');
    } catch (e) {
        console.error('❌ Migration Error:', e);
    }

    process.exit(0);
}

migrate();
