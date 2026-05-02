const db = require('./models');

async function sync() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ PostgreSQL Connected');
        await db.sequelize.sync({ alter: true });
        console.log('✅ Database Synced (Alter)');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

sync();
