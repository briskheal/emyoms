const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function printText() {
    const pdfPath = path.join(__dirname, '..', 'EMYRIS-OMS-invoice_sample.jpg.PDF');
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    console.log("--- Extracted PDF Text ---");
    console.log(pdfData.text);
    console.log("-------------------------");
}

printText();
