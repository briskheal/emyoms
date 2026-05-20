const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function dumpText() {
    const filePath = path.join(__dirname, '../EMYRIS-OMS-invoice_sample.jpg.PDF');
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    console.log(pdfData.text);
    process.exit(0);
}

dumpText();
