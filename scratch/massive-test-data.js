const db = require('../models');

async function prepareMassiveTestData() {
    console.log('🧪 Preparing Massive Test Data for 50 Products...');
    const t = await db.sequelize.transaction();

    try {
        const products = await db.Product.findAll();

        for (const p of products) {
            // 1. Ensure mandatory fields are filled
            const updateData = {
                hsn: p.hsn || '30049099',
                manufacturer: p.manufacturer || 'TEST PHARMA',
                packing: p.packing || '10x10',
                qtyAvailable: 100 // Overriding with 50 (test1) + 50 (test2)
            };

            // Ensure Prices are valid for testing
            if (!p.mrp || p.mrp === 0) updateData.mrp = 100;
            if (!p.ptr || p.ptr === 0) updateData.ptr = 70;
            if (!p.pts || p.pts === 0) updateData.pts = 65;
            if (!p.gstPercent || p.gstPercent === 0) updateData.gstPercent = 5;

            await p.update(updateData, { transaction: t });

            // 2. Delete existing batches
            await db.Batch.destroy({ where: { productId: p.id }, transaction: t });

            // 3. Add fresh test batches
            await db.Batch.bulkCreate([
                {
                    batchNo: 'test1',
                    qtyAvailable: 50,
                    expDate: '12-2030',
                    mfgDate: '01-2024',
                    productId: p.id
                },
                {
                    batchNo: 'test2',
                    qtyAvailable: 50,
                    expDate: '12-2032',
                    mfgDate: '01-2024',
                    productId: p.id
                }
            ], { transaction: t });
        }

        await t.commit();
        console.log('✅ MASSIVE TEST DATA READY.');
        console.log('✅ 100 Units (50x2 Batches) assigned to every product.');
        console.log('✅ Missing HSNs and Manufacturers filled with test defaults.');
    } catch (error) {
        await t.rollback();
        console.error('❌ Data preparation failed:', error);
    } finally {
        await db.sequelize.close();
    }
}

prepareMassiveTestData();
