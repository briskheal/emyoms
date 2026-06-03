const fs = require('fs');

let content = fs.readFileSync('script.js', 'utf8');

const bridgeCode = `
async function generateInvoicePDF(inv) {
    const PDFLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!PDFLib) throw new Error("PDF Library (jsPDF) not loaded properly.");
    const doc = new PDFLib('p', 'mm', 'a4');
    
    const mappedItems = (inv.items || []).map(it => {
        return { 
            name: it.name,
            hsn: it.hsn || '-',
            batch: it.batch || '-',
            expDate: it.expDate || it.exp || it.expiry || '-',
            mrp: it.mrp || 0,
            ptr: it.ptr || 0,
            pts: it.priceUsed !== undefined ? it.priceUsed : it.rate,
            price: it.priceUsed !== undefined ? it.priceUsed : it.rate,
            qty: it.qty,
            bonusQty: it.bonusQty || it.free || 0,
            gstPercent: it.gstPercent || 0
        };
    });

    await generateStandardPDF({
        doc,
        title: "TAX INVOICE",
        docNo: inv.invoiceNo,
        date: new Date(inv.createdAt).toLocaleDateString('en-GB'),
        party: { 
            name: inv.stockistName || currentUser?.name || 'Direct Customer', 
            address: currentUser?.address || '', 
            gst: currentUser?.gstNo || currentUser?.gst || '', 
            dl: currentUser?.dlNo || currentUser?.dl || '' 
        },
        items: mappedItems,
        grandTotal: inv.grandTotal,
        filename: \`Invoice_\${inv.invoiceNo}.pdf\`,
        showBank: true,
        extraFields: []
    });
}
`;

const startIndex = content.indexOf('async function generateInvoicePDF(inv) {');
const endIndex = content.indexOf('// --- PDCN WORKSHEET LOGIC ---');

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + bridgeCode + '\n' + content.substring(endIndex);
    fs.writeFileSync('script.js', content);
    console.log("script.js updated successfully.");
} else {
    console.error("Could not find start or end index.");
}
