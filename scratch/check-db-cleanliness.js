const db = require('../models');

async function checkDatabaseCleanliness() {
    console.log('--- Database Cleanliness Check ---');
    
    try {
        await db.sequelize.authenticate();
        console.log('✅ Connected to database.');

        // 1. Check for Duplicate Products (Name)
        const products = await db.Product.findAll({ attributes: ['name', [db.sequelize.fn('count', db.sequelize.col('name')), 'cnt']], group: ['name'], having: db.sequelize.where(db.sequelize.fn('count', db.sequelize.col('name')), '>', 1) });
        if (products.length > 0) {
            console.log(`❌ Found ${products.length} products with duplicate names:`, products.map(p => p.name));
        } else {
            console.log('✅ No duplicate product names found.');
        }

        // 2. Check for Duplicate Batches (productId + batchNo)
        const duplicateBatches = await db.Batch.findAll({
            attributes: ['productId', 'batchNo', [db.sequelize.fn('count', db.sequelize.col('batchNo')), 'cnt']],
            group: ['productId', 'batchNo'],
            having: db.sequelize.where(db.sequelize.fn('count', db.sequelize.col('batchNo')), '>', 1)
        });
        if (duplicateBatches.length > 0) {
            console.log(`❌ Found ${duplicateBatches.length} duplicate batches (Product + BatchNo):`);
            for (const b of duplicateBatches) {
                console.log(`   - ProductID: ${b.productId}, BatchNo: ${b.batchNo} (Count: ${b.getDataValue('cnt')})`);
            }
        } else {
            console.log('✅ No duplicate batches found.');
        }

        // 3. Check for Orphan Batches (no product)
        const orphanBatches = await db.Batch.findAll({
            where: {
                productId: { [db.Sequelize.Op.notIn]: db.sequelize.literal('(SELECT id FROM "Products")') }
            }
        });
        if (orphanBatches.length > 0) {
            console.log(`❌ Found ${orphanBatches.length} orphan batches (no matching product).`);
        } else {
            console.log('✅ No orphan batches found.');
        }

        // 4. Check for Batches with Empty batchNo
        const emptyBatches = await db.Batch.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { batchNo: '' },
                    { batchNo: { [db.Sequelize.Op.is]: null } }
                ]
            }
        });
        if (emptyBatches.length > 0) {
            console.log(`❌ Found ${emptyBatches.length} batches with empty or null batch numbers.`);
        } else {
            console.log('✅ No empty batch numbers found.');
        }

        // 5. Check for Products without Category
        const productsNoCat = await db.Product.count({ where: { category: { [db.Sequelize.Op.or]: ['', null] } } });
        if (productsNoCat > 0) {
            console.log(`⚠️ Found ${productsNoCat} products without a category.`);
        }

        console.log('--- Check Complete ---');
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        await db.sequelize.close();
    }
}

checkDatabaseCleanliness();
