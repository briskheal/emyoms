const db = require('../models');

async function fixDataAndCounters() {
    console.log('🛠️ Fixing NaN values and Resetting Counters...');
    const t = await db.sequelize.transaction();

    try {
        // 1. Fix NaN in Invoices
        const invoices = await db.Invoice.findAll({ include: [{ model: db.InvoiceItem, as: 'items' }] });
        for (const inv of invoices) {
            let subTotal = 0;
            let gstAmount = 0;
            for (const item of inv.items) {
                const taxable = Number(item.totalValue) || (Number(item.qty) * Number(item.priceUsed)) || 0;
                const rate = Number(item.gstPercent) || 0;
                subTotal += taxable;
                gstAmount += (taxable * rate / 100);
            }
            
            await inv.update({
                subTotal: Number(subTotal.toFixed(2)),
                gstAmount: Number(gstAmount.toFixed(2)),
                grandTotal: Math.round(subTotal + gstAmount),
                outstandingAmount: Math.round(subTotal + gstAmount)
            }, { transaction: t });
            console.log(`✅ Fixed Invoice: ${inv.invoiceNo}`);
        }

        // 2. Fix NaN in Orders
        const orders = await db.Order.findAll({ include: [{ model: db.OrderItem, as: 'items' }] });
        for (const order of orders) {
            let subTotal = 0;
            let gstAmount = 0;
            for (const item of order.items) {
                const taxable = Number(item.totalValue) || (Number(item.qty) * Number(item.priceUsed)) || 0;
                const rate = Number(item.gstPercent) || 0;
                subTotal += taxable;
                gstAmount += (taxable * rate / 100);
            }
            await order.update({
                subTotal: Number(subTotal.toFixed(2)),
                gstAmount: Number(gstAmount.toFixed(2)),
                grandTotal: Math.round(subTotal + gstAmount)
            }, { transaction: t });
            console.log(`✅ Fixed Order: ${order.orderNo}`);
        }

        // 3. Fix Counters (Set to 1 so the next one is 0002, or 0 if we want the next one to be 0001)
        // Actually, with my new logic (increment before use), nextNumber: 1 means the next doc is 0002.
        // If the user already has one invoice (0000), they probably want the next to be 0001.
        // But they said "this invoice would have been 0001".
        // I will set nextNumber to 1 so the next one is 0002, assuming 0001 is used.
        // Wait, the current invoice is 0000. I'll rename it to 0001 and set counter to 1.
        
        const company = await db.Company.findOne({ transaction: t });
        if (company) {
            const counters = company.documentCounters || {};
            Object.keys(counters).forEach(key => {
                // Set to 1 because we already have 1 document (the broken one we just fixed)
                counters[key].nextNumber = 1;
            });
            await company.update({ documentCounters: counters }, { transaction: t });
            console.log('✅ Counters reset to 1.');
        }

        // 4. Rename the 0000 invoice to 0001 if it exists
        const inv0 = await db.Invoice.findOne({ where: { invoiceNo: 'E-INV-26-27-0000' }, transaction: t });
        if (inv0) {
            await inv0.update({ invoiceNo: 'E-INV-26-27-0001' }, { transaction: t });
            console.log('✅ Renamed invoice 0000 to 0001');
        }

        await t.commit();
        console.log('🎉 DATA REPAIR COMPLETE.');
    } catch (error) {
        await t.rollback();
        console.error('❌ REPAIR FAILED:', error);
    } finally {
        await db.sequelize.close();
    }
}

fixDataAndCounters();
