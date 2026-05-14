const db = require('../models');

async function checkProducts() {
    try {
        const products = await db.Product.findAll();
        console.log(`Checking ${products.length} products:`);
        products.forEach(p => {
            console.log(`ID: ${p.id}, Name: ${p.name}, PurchaseRate: ${p.purchaseRate}, PTS: ${p.pts}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkProducts();
