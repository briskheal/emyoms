const db = require('../models');

async function deleteData() {
    const transaction = await db.sequelize.transaction();
    try {
        // --- Handle Invoices ---
        const invoiceItems = await db.InvoiceItem.findAll({
            where: { gstPercent: 12 },
            transaction
        });

        const invoiceIds = [...new Set(invoiceItems.map(item => item.invoiceId))];
        console.log(`Found ${invoiceIds.length} invoices with 12% GST items.`);

        for (const invoiceId of invoiceIds) {
            const invoice = await db.Invoice.findByPk(invoiceId, { transaction });
            if (invoice) {
                console.log(`Deleting Invoice: ${invoice.invoiceNo} (ID: ${invoice.id})`);
                
                await db.InvoiceItem.destroy({ where: { invoiceId: invoice.id }, transaction });
                
                if (invoice.orderId) {
                    const order = await db.Order.findByPk(invoice.orderId, { transaction });
                    if (order) {
                        console.log(`- Also deleting linked Order: ${order.orderNo} (ID: ${order.id})`);
                        await db.OrderItem.destroy({ where: { orderId: order.id }, transaction });
                        await db.Order.destroy({ where: { id: order.id }, transaction });
                    }
                }
                await db.Invoice.destroy({ where: { id: invoice.id }, transaction });
            }
        }

        // --- Handle Orders that might not have Invoices yet ---
        const orderItems = await db.OrderItem.findAll({
            where: { gstPercent: 12 },
            transaction
        });

        const orderIds = [...new Set(orderItems.map(item => item.orderId))];
        console.log(`Found ${orderIds.length} orders with 12% GST items (including those possibly already handled).`);

        for (const orderId of orderIds) {
            const order = await db.Order.findByPk(orderId, { transaction });
            if (order) {
                console.log(`Deleting Order: ${order.orderNo} (ID: ${order.id})`);
                
                // Check if there's an invoice for this order (that wasn't caught by the invoice check)
                const invoice = await db.Invoice.findOne({ where: { orderId: order.id }, transaction });
                if (invoice) {
                    console.log(`- Also deleting linked Invoice: ${invoice.invoiceNo} (ID: ${invoice.id})`);
                    await db.InvoiceItem.destroy({ where: { invoiceId: invoice.id }, transaction });
                    await db.Invoice.destroy({ where: { id: invoice.id }, transaction });
                }

                await db.OrderItem.destroy({ where: { orderId: order.id }, transaction });
                await db.Order.destroy({ where: { id: order.id }, transaction });
            }
        }

        await transaction.commit();
        console.log('Successfully cleaned up 12% GST data.');
    } catch (error) {
        await transaction.rollback();
        console.error('Error during cleanup:', error);
    } finally {
        await db.sequelize.close();
    }
}

deleteData();
