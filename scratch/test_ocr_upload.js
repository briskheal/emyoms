const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testOCR() {
    const pdfPath = path.join(__dirname, '..', 'EMYRIS-OMS-invoice_sample.jpg.PDF');
    if (!fs.existsSync(pdfPath)) {
        console.error("❌ PDF not found at:", pdfPath);
        return;
    }

    // We need to find a stockist/supplier in the database to test
    const db = require('../models');
    await db.sequelize.authenticate();
    const stockist = await db.Stockist.findOne();
    if (!stockist) {
        console.error("❌ No stockist found in database.");
        return;
    }
    console.log(`ℹ️ Testing with Stockist: ${stockist.name} (${stockist.id || stockist._id})`);

    const formData = new FormData();
    formData.append('invoice', fs.createReadStream(pdfPath));
    formData.append('stockistId', String(stockist.id || stockist._id));

    try {
        console.log("📤 Sending PDF upload request...");
        const response = await axios.post('http://localhost:5000/api/stockist/upload-invoice-read', formData, {
            headers: formData.getHeaders()
        });
        console.log("✅ Response:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("❌ Request Failed:", error.response ? error.response.data : error.message);
    } finally {
        await db.sequelize.close();
    }
}

testOCR();
