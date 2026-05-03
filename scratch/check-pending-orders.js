const db = require('../models');

async function checkPendingOrders() {
    try {
        const orders = await db.Order.findAll({
            where: { status: 'pending' }
        });
        console.log(`Found ${orders.length} pending orders.`);
        orders.forEach(o => {
            console.log(`- Order: ${o.orderNo} | subTotal: ${o.subTotal} | gstAmount: ${o.gstAmount} | grandTotal: ${o.grandTotal}`);
        });
    } catch (error) {
        console.error('Error checking orders:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkPendingOrders();
