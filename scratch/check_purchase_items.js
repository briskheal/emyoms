const db = require('../models');

async function checkPurchaseItems() {
    try {
        const items = await db.PurchaseItem.findAll();
        console.log(`Checking ${items.length} purchase items:`);
        items.forEach(it => {
            console.log(`ID: ${it.id}, ProdID: ${it.productId}, Name: ${it.name}, PurchaseRate: ${it.purchaseRate}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkPurchaseItems();
