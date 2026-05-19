const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const PDF_PATH = `C:\\Users\\J S DASH\\Desktop\\aadi\\CRITICARE_HEALTHCARE_Invoice_AP_SL_26_27_56.pdf`;
const BASE_URL = 'http://localhost:5000';

async function run() {
    console.log("🚀 Simulating direct Stockist Registry Upload of CRITICARE HEALTHCARE invoice...");
    if (!fs.existsSync(PDF_PATH)) {
        console.error("❌ File not found!");
        return;
    }

    const form = new FormData();
    form.append('invoice', fs.createReadStream(PDF_PATH));
    form.append('stockistId', '5'); // AADI PARASWANATH
    form.append('stockistName', 'AADI PARASWANATH IMPORT AND EXPORT INC');

    try {
        const res = await axios.post(`${BASE_URL}/api/stockist/upload-invoice-read`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        console.log("✅ Server response success!");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("❌ Server upload request failed!");
        if (e.response && e.response.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}

run();
