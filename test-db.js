const db = require('./models');

async function testConnection() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Connection to PostgreSQL has been established successfully.');
        
        // Try to sync one model
        await db.sequelize.sync();
        console.log('✅ Database Tables have been synchronized.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        console.log('\n💡 TIP: Check if your DATABASE_URL in .env is correct and includes ?sslmode=require');
        process.exit(1);
    }
}

testConnection();
