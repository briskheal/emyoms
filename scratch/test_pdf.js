const PDFParser = require('pdf2json');
const fs = require('fs');

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {
    const pages = pdfData.Pages;
    if (pages.length > 0 && pages[0].Texts.length > 0) {
        console.log("Raw Text Object 1:", JSON.stringify(pages[0].Texts[0], null, 2));
        console.log("Raw Text Object 20:", JSON.stringify(pages[0].Texts[20], null, 2));
    }
});

pdfParser.loadPDF("./EMYRIS-OMS-invoice_sample.jpg.PDF");
