const db = require('../models');

async function auditInvoiceGST() {
    try {
        const items = await db.InvoiceItem.findAll();
        console.log(`Total Invoice Items found: ${items.length}`);
        
        const gstStats = {};
        items.forEach(i => {
            const gst = i.gstPercent;
            gstStats[gst] = (gstStats[gst] || 0) + 1;
        });

        console.log("\n--- Invoice Items GST Distribution ---");
        Object.keys(gstStats).forEach(gst => {
            console.log(`GST ${gst}%: ${gstStats[gst]} items`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

auditInvoiceGST();
