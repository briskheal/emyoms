const db = require('../models');
const { Op } = require('sequelize');

async function checkProducts() {
    try {
        // 1. Check products with 12% GST
        const productsByGST = await db.Product.findAll({
            where: { gstPercent: 12 }
        });
        
        console.log(`Found ${productsByGST.length} products with 12% GST.`);
        productsByGST.forEach(p => {
            console.log(`- [${p.id}] ${p.name} (Category: ${p.category})`);
        });

        // 2. Check products in a "12%" category (if any)
        const productsByCategory = await db.Product.findAll({
            where: {
                category: {
                    [Op.iLike]: '%12%'
                }
            }
        });

        console.log(`\nFound ${productsByCategory.length} products with "12" in category name.`);
        productsByCategory.forEach(p => {
            console.log(`- [${p.id}] ${p.name} (Category: ${p.category}, GST: ${p.gstPercent}%)`);
        });

    } catch (error) {
        console.error('Error checking products:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkProducts();
