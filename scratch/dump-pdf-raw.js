const PDFParser = require('pdf2json');
const pdfParser = new PDFParser();
const path = require('path');

const filePath = path.join(__dirname, '../EMYRIS-OMS-invoice_sample.jpg.PDF');

pdfParser.on("pdfParser_dataError", errData => console.error(errData));
pdfParser.on("pdfParser_dataReady", pdfData => {
    const page = pdfData.Pages[0];
    console.log("Raw page dimensions:", page.Width, page.Height);
    console.log("First 10 text objects:");
    console.log(JSON.stringify(page.Texts.slice(0, 10), null, 2));
    process.exit(0);
});

pdfParser.loadPDF(filePath);
