const db = require('../models');

async function checkProductGST() {
    try {
        const products = await db.Product.findAll({ limit: 5 });
        console.log("--- Products GST Check ---");
        products.forEach(p => {
            console.log(`Product: ${p.name}, gstPercent: ${p.gstPercent}`);
        });
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkProductGST();
