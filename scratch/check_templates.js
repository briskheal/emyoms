const db = require('../models');

async function checkTemplates() {
    try {
        await db.sequelize.authenticate();
        console.log("✅ Database connected.");

        const templates = await db.InvoiceTemplate.findAll();
        console.log(`ℹ️ Found ${templates.length} templates:`);
        templates.forEach(t => {
            console.log(`- Template ID: ${t.id}, Stockist ID: ${t.stockistId}, Anchor: ${t.anchorKeyword}`);
        });

        const stockists = await db.Stockist.findAll({
            where: { approved: true }
        });
        console.log(`ℹ️ Found ${stockists.length} approved stockists:`);
        stockists.forEach(s => {
            console.log(`- Stockist ID: ${s.id || s._id}, Name: ${s.name}, GST: ${s.gstNo}, Type: ${s.partyType}`);
        });
    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await db.sequelize.close();
    }
}

checkTemplates();
