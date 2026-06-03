const fs = require('fs');
const path = require('path');

async function testUpload() {
    const filePath = path.join(__dirname, 'dummy.pdf');
    fs.writeFileSync(filePath, 'dummy pdf content');
    
    const formData = new FormData();
    const blob = new Blob([fs.readFileSync(filePath)], { type: 'application/pdf' });
    formData.append('invoice', blob, 'dummy.pdf');
    formData.append('stockistName', 'H D SALES');
    formData.append('stockistId', '3');
    
    try {
        const res = await fetch('http://localhost:5000/api/stockist/upload-invoice-read', {
            method: 'POST',
            body: formData
        });
        const text = await res.text();
        console.log('Response:', text.substring(0, 500));
    } catch(e) {
        console.error(e);
    }
}
testUpload();
