const db = require('./models');

async function checkPendingOrders() {
    await db.sequelize.authenticate();
    const orders = await db.Order.findAll({ where: { status: 'pending' }, include: ['items'] });
    console.log(JSON.stringify(orders, null, 2));
    process.exit(0);
}
checkPendingOrders();
