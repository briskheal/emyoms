const db = require('../models');

async function auditProducts() {
    try {
        const products = await db.Product.findAll();
        console.log(`Total Products found: ${products.length}`);
        
        const gstStats = {};
        const productsWith12 = [];

        products.forEach(p => {
            const gst = p.gstPercent;
            gstStats[gst] = (gstStats[gst] || 0) + 1;
            if (gst == 12) {
                productsWith12.push(p.name);
            }
        });

        console.log("\n--- GST Distribution ---");
        Object.keys(gstStats).forEach(gst => {
            console.log(`GST ${gst}%: ${gstStats[gst]} products`);
        });

        console.log("\n--- Sample Products with 12% GST ---");
        if (productsWith12.length > 0) {
            productsWith12.slice(0, 10).forEach(name => console.log(`- ${name}`));
            if (productsWith12.length > 10) console.log(`... and ${productsWith12.length - 10} more.`);
        } else {
            console.log("None found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

auditProducts();
