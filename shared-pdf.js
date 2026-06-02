
// shared-pdf.js - Shared PDF Generation Logic for Admin and Stockist
window.getCompanyProfile = function() {
    if (typeof companyProfile !== 'undefined' && companyProfile) return companyProfile;
    if (typeof companySettings !== 'undefined' && companySettings) return companySettings;
    return {};
};

function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const g = ['', 'Thousand', 'Lakh', 'Crore'];
    const makeGroup = (n) => {
        let s = '';
        if (n >= 100) { s += a[Math.floor(n / 100)] + 'Hundred '; n %= 100; }
        if (n >= 20) { s += b[Math.floor(n / 10)] + ' '; n %= 10; }
        if (n > 0) s += a[n];
        return s;
    };
    if (num === 0) return 'Zero';
    let ns = num.toString().split('.');
    let integer = parseInt(ns[0]);
    let fraction = ns[1] ? parseInt(ns[1]) : 0;
    let out = ''; let i = 0;
    while (integer > 0) {
        let group = (i === 0) ? integer % 1000 : integer % 100;
        integer = (i === 0) ? Math.floor(integer / 1000) : Math.floor(integer / 100);
        if (group > 0) out = makeGroup(group) + (g[i] ? g[i] + ' ' : '') + out;
        i++;
    }
    let final = 'Rupees ' + out.trim();
    if (fraction > 0) final += ' and ' + (fraction < 10 ? '0'+fraction : fraction) + '/100 Paise';
    return final + ' Only';
}

async function generateStandardPDF({ 
    doc: passedDoc, title, subTitle = "Original For Recipient", docNo, docTypeLabel = "Invoice No", date, party, items, additionalCharges = [], grandTotal, terms, showBank, extraFields = [], filename = null
}) {
    const PDFLib = window.jspdf ? window.jspdf.jsPDF : (window.jsPDF || window.jspdf);
    const doc = passedDoc || new PDFLib('p', 'mm', 'a4');
    const style = (getCompanyProfile() && getCompanyProfile().invoiceStyle) || 'sample';

    if (style === 'sample' || style === 'classic') {
        // Use the comprehensive version defined later in the file
        return await generateSampleMatchedPDF({ 
            doc, title, subTitle, docNo, docTypeLabel, date, party, items, additionalCharges, grandTotal, terms, showBank, extraFields, filename 
        });
    }

    // Header
    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text(getCompanyProfile().name || "EMYRIS", 105, 15, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(getCompanyProfile().address || "", 105, 20, { align: 'center' });
    doc.text(`GSTIN: ${getCompanyProfile().gstNo} | DL: ${getCompanyProfile().dlNo}`, 105, 25, { align: 'center' });
    doc.line(10, 30, 200, 30);

    // Party & Doc Info
    doc.setFontSize(9); doc.text(`Party: ${party.name}`, 15, 38);
    doc.text(`Address: ${party.address || 'N/A'}`, 15, 43);
    doc.text(`GSTIN: ${party.gst || 'N/A'}`, 15, 48);
    
    doc.text(`${docTypeLabel}: ${docNo}`, 140, 38);
    doc.text(`Date: ${date}`, 140, 43);
    extraFields.forEach((f, i) => doc.text(`${f.label}: ${f.value}`, 140, 48 + (i * 5)));

    // Table
    doc.autoTable({
        startY: 65,
        head: [['S.No', 'Description', 'HSN', 'Batch', 'Exp', 'MRP', 'PTR', 'PTS', 'Qty', 'Free', 'GST%', 'Total']],
        body: items.map((it, idx) => {
            const price = Number(it.price) || 0;
            const pts = Number(it.pts || price) || 0;
            const ptr = Number(it.ptr) || 0;
            const bonus = Number(it.bonusQty || 0);
            const rate = Number(it.gstPercent) || 0;
            const taxable = Number(it.qty) * price;
            const total = taxable + (taxable * rate / 100);
            return [
                idx + 1, it.name, it.hsn || '-', it.batch || '-', it.expDate || it.exp || it.expiry || '-', 
                (Number(it.mrp) || 0).toFixed(2), ptr.toFixed(2), pts.toFixed(2), 
                it.qty, bonus, rate + '%', total.toFixed(2)
            ];
        }),
        theme: 'grid', headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 7 }
    });


    const finalY = doc.lastAutoTable.finalY + 10;
    const gTotal = Number(grandTotal) || 0;
    doc.text(`Grand Total: Rs. ${gTotal.toFixed(2)}`, 195, finalY, { align: 'right' });
    doc.text(`Words: ${numberToWords(gTotal)}`, 15, finalY + 10);

    
    if (filename) {
        doc.save(filename);
    }
    return doc;
}

async function generateSampleMatchedPDF({ 
    doc, title, subTitle, docNo, docTypeLabel, date, party, items, additionalCharges = [], grandTotal, terms, showBank, extraFields, filename 
}) {
    // --- 1. SETTINGS & COLORS ---
    const pageH = 297; const pageW = 210;
    const themeHex = (getCompanyProfile() && getCompanyProfile().themeColor) || "#6366f1";
    
    // Helper to convert Hex to RGB
    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };
    const themeRgb = hexToRgb(themeHex);

    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]); 
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // Outer Main Theme Border

    // --- 2. HEADER SECTION (LOGO + COMPANY) ---
    let headerY = 15;
    if (getCompanyProfile() && getCompanyProfile().logoImage) {
        try { 
            const imgData = getCompanyProfile().logoImage;
            const format = imgData.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
            // Wider logo as requested (40x22), moved slightly left
            doc.addImage(imgData, format, 12, headerY - 3, 40, 22);
        } catch(e) { console.warn("Logo add failed", e); }
    }

    // Company Name & Details - Shifted Right to accommodate wider logo
    const headerX = 58; 
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text((getCompanyProfile() && getCompanyProfile().name) || "EMYRIS BIOLIFESCIENCES", headerX, headerY + 5);
    
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(60);
    const coAddr = (getCompanyProfile() && getCompanyProfile().address) || "Office Address Loading...";
    const addrLines = doc.splitTextToSize(coAddr, 140);
    doc.text(addrLines, headerX, headerY + 10);
    
    let infoY = headerY + 10 + (addrLines.length * 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(0);
    doc.text(`GSTIN: ${(getCompanyProfile() && getCompanyProfile().gstNo) || 'N/A'} | DL No: ${(getCompanyProfile() && getCompanyProfile().dlNo) || 'N/A'}`, headerX, infoY);
    doc.setFont("helvetica", "normal");
    doc.text(`Contact: ${(getCompanyProfile() && getCompanyProfile().phones?.[0]) || 'N/A'} | Email: ${(getCompanyProfile() && getCompanyProfile().emails?.[0]) || 'N/A'}`, headerX, infoY + 4);

    // TAX INVOICE LABEL - Clean Bold Design (No Box)
    doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    const isPurchase = title.includes("PURCHASE");
    doc.setFontSize(isPurchase ? 9 : 12); doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), pageW - 10, infoY - 1, { align: 'right' });
    doc.setTextColor(0);

    // Right Top Label below border line - Perfectly aligned with the box edge
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Original Inv. for Buyer", pageW - 10, 14, { align: 'right' });

    let nextY = infoY + 8;
    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.line(10, nextY, 200, nextY); // Header Separator

    // --- 3. METADATA BOX (PARTY & INVOICE DETAILS) ---
    let boxY = nextY + 5;
    let boxH = 35;
    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]); doc.setLineWidth(0.2);
    doc.rect(10, boxY, 190, boxH); // Metadata Outer Box (Standardized 10-200)
    doc.line(120, boxY, 120, boxY + boxH); // Vertical Split

    // LEFT: PARTY INFO
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text(isPurchase ? "BILL FROM (SUPPLIER DETAILS):" : "BILL TO (PARTY DETAILS):", 15, boxY + 5);
    doc.setFontSize(10); doc.setTextColor(0);
    doc.text(party.name || 'N/A', 15, boxY + 10);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
    const pAddrLines = doc.splitTextToSize(party.address || 'N/A', 100);
    doc.text(pAddrLines, 15, boxY + 14);
    
    let partySubY = boxY + 14 + (pAddrLines.length * 3.5);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7);
    doc.text(`GSTIN: ${party.gst || 'N/A'} | DL: ${party.dl || 'N/A'}`, 15, partySubY + 2);

    // RIGHT: INVOICE INFO
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text("DOCUMENT DETAILS:", 123, boxY + 5);
    doc.setFontSize(8); doc.setTextColor(0); doc.setFont("helvetica", "normal");
    doc.text(`${docTypeLabel}:`, 123, boxY + 10); doc.setFont("helvetica", "bold"); doc.text(docNo, 155, boxY + 10);
    doc.setFont("helvetica", "normal"); doc.text(`Date:`, 123, boxY + 15); doc.setFont("helvetica", "bold"); doc.text(date, 155, boxY + 15);
    
    extraFields.forEach((f, i) => {
        doc.setFont("helvetica", "normal"); doc.text(`${f.label}:`, 123, boxY + 20 + (i * 5));
        doc.setFont("helvetica", "bold"); doc.text(f.value || '-', 155, boxY + 20 + (i * 5));
    });

    // --- 4. ITEMS TABLE ---
    const tableHead = isPurchase 
        ? [['Sn', 'HSN', 'Product Description', 'Batch', 'Exp', 'MRP', 'Purc. Rate', 'Qty', 'Free', 'GST%', 'Amount']]
        : [['Sn', 'HSN', 'Product Description', 'Batch', 'Exp', 'MRP', 'PTR', 'PTS', 'Qty', 'Free', 'GST%', 'Amount']];

    doc.autoTable({
        startY: boxY + boxH + 5,
        head: tableHead,
        body: [
            ...items.map((it, idx) => {
                const mrp = Number(it.mrp || 0);
                const price = Number(it.price || it.pts || 0);
                const ptr = Number(it.ptr || 0);
                const pts = Number(it.pts || 0);
                const qty = Number(it.qty || 0);
                const bonus = Number(it.bonusQty || 0);
                const expStr = it.expDate || it.expiry || it.exp || '-';
                const mfgName = it.manufacturer || (it.product && it.product.manufacturer) || 'EMYRIS';
                
                if (isPurchase) {
                    return [
                        idx + 1, it.hsn || '-', 
                        { content: `${it.name}\n[Mfg: ${mfgName}]`, styles: { fontStyle: 'bold' } }, 
                        it.batch || '-', expStr, 
                        mrp.toFixed(2), price.toFixed(2), 
                        qty, bonus, Math.floor(it.gstPercent || 0) + '%', 
                        (qty * price).toFixed(2)
                    ];
                } else {
                    return [
                        idx + 1, it.hsn || '-', 
                        { content: `${it.name}\n[Mfg: ${mfgName}]`, styles: { fontStyle: 'bold' } }, 
                        it.batch || '-', expStr, 
                        mrp.toFixed(2), ptr.toFixed(2), pts.toFixed(2), 
                        qty, bonus, Math.floor(it.gstPercent || 0) + '%', 
                        (qty * pts).toFixed(2)
                    ];
                }
            }),
            ...additionalCharges.map((c, idx) => {
                const baseAmt = Number(c.amount || 0);
                if (isPurchase) {
                    return [
                        '#', c.hsn || '-', 
                        { content: `CHARGE: ${c.name}`, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
                        '-', '-', '-', baseAmt.toFixed(2), 
                        '1', '0', Math.floor(c.gstPct || 0) + '%', c.total.toFixed(2)
                    ];
                } else {
                    return [
                        '#', c.hsn || '-', 
                        { content: `CHARGE: ${c.name}`, styles: { fontStyle: 'italic', textColor: [100, 100, 100] } },
                        '-', '-', '-', '-', baseAmt.toFixed(2), '1', '0', Math.floor(c.gstPct || 0) + '%', c.total.toFixed(2)
                    ];
                }
            })
        ],
        theme: 'grid',
        headStyles: { fillColor: themeRgb, textColor: 255, fontStyle: 'bold', fontSize: 7, halign: 'center' },
        styles: { fontSize: 7, cellPadding: 2, textColor: 0, lineWidth: 0.1, lineColor: themeRgb },
        columnStyles: isPurchase ? {
            0: { cellWidth: 8, halign: 'center' },
            2: { cellWidth: 'auto' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            9: { halign: 'right' },
            10: { halign: 'right', fontStyle: 'bold' }
        } : {
            0: { cellWidth: 8, halign: 'center' },
            2: { cellWidth: 'auto' },
            5: { halign: 'right' },
            10: { halign: 'right' },
            11: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 10, right: 10 }
    });

    let tableFinalY = doc.lastAutoTable.finalY;

    // --- 5. TAX SUMMARY & TOTALS ---
    const summaryY = tableFinalY + 5;
    if (summaryY > 230) doc.addPage(); 
    
    const taxMap = {};
    let totalTaxable = 0; let totalGST = 0;
    items.forEach(it => {
        const rate = parseFloat(it.gstPercent) || 0;
        const price = Number(it.price || it.pts || 0);
        const qty = Number(it.qty || 0);
        const taxable = qty * price;
        const gst = (taxable * rate) / 100;
        if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
        taxMap[rate].taxable += taxable;
        taxMap[rate].tax += gst;
        totalTaxable += taxable; totalGST += gst;
    });

    // Add Additional Charges to Tax Map
    additionalCharges.forEach(c => {
        const rate = parseFloat(c.gstPct) || 0;
        const taxable = Number(c.amount || 0);
        const gst = Number(c.gstAmount || 0);
        if (!taxMap[rate]) taxMap[rate] = { taxable: 0, tax: 0 };
        taxMap[rate].taxable += taxable;
        taxMap[rate].tax += gst;
        totalTaxable += taxable; totalGST += gst;
    });

    const supplyField = extraFields.find(f => f.label === 'Place of Supply');
    const supplyState = (supplyField ? supplyField.value : '').toLowerCase();
    const isIntra = (getCompanyProfile().gstNo?.substring(0,2) === party.gst?.substring(0,2)) || supplyState.includes('telangana');
    const isInter = !isIntra;
    const taxHeader = isInter ? [['GST%', 'Taxable', 'IGST', 'Total Tax']] : [['GST%', 'Taxable', 'CGST', 'SGST', 'Total Tax']];
    let taxBody = [];
    Object.keys(taxMap).sort((a,b)=>a-b).forEach(r => {
        const rate = parseFloat(r); const d = taxMap[r];
        const label = Math.floor(rate) + '%';
        if (isInter) { taxBody.push([label, d.taxable.toFixed(2), d.tax.toFixed(2), d.tax.toFixed(2)]); }
        else { taxBody.push([label, d.taxable.toFixed(2), (d.tax/2).toFixed(2), (d.tax/2).toFixed(2), d.tax.toFixed(2)]); }
    });

    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text("GST TAX SUMMARY", 12, summaryY);
    doc.autoTable({
        startY: summaryY + 2,
        head: taxHeader,
        body: taxBody,
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: 0, fontSize: 6.5, halign: 'center' },
        styles: { fontSize: 6.5, halign: 'right', cellPadding: 1.5, lineColor: themeRgb },
        margin: { left: 10 },
        tableWidth: isInter ? 65 : 85
    });

    // Totals Block
    const tX = 145;
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal");
    doc.text("Total Taxable Amt:", tX, summaryY + 5); doc.text(`Rs. ${totalTaxable.toFixed(2)}`, 198, summaryY + 5, { align: 'right' });
    doc.text("Total GST Amt:", tX, summaryY + 10); doc.text(`Rs. ${totalGST.toFixed(2)}`, 198, summaryY + 10, { align: 'right' });
    const roundOff = (grandTotal - (totalTaxable + totalGST)).toFixed(2);
    doc.text("Round Off Adj:", tX, summaryY + 15); doc.text(`Rs. ${roundOff}`, 198, summaryY + 15, { align: 'right' });
    doc.line(tX - 2, summaryY + 18, 200, summaryY + 18);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(themeRgb[0], themeRgb[1], themeRgb[2]);
    doc.text("GRAND TOTAL:", tX, summaryY + 24); doc.text(`Rs. ${grandTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`, 198, summaryY + 24, { align: 'right' });
    doc.setTextColor(0);

    doc.setFontSize(7.5); doc.setFont("helvetica", "italic");
    doc.text(`Amount in Words: ${numberToWords(grandTotal)}`, 12, doc.lastAutoTable.finalY + 10);

    // --- 6. FOOTER (BANK, TERMS, SIGN, QR) ---
    const footerY = 250;
    doc.setDrawColor(themeRgb[0], themeRgb[1], themeRgb[2]); doc.line(10, footerY - 2, 200, footerY - 2);
    
    // Bank Details
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text("BANK DETAILS:", 12, footerY + 2);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
    const bankLines = (getCompanyProfile().bankDetails || "").split('\n');
    let bankLastY = footerY + 2;
    bankLines.forEach((l, i) => {
        bankLastY = footerY + 6 + (i * 3);
        doc.text(l.trim(), 12, bankLastY);
    });

    // QR Code Generation
    let upiLink = "";
    if (getCompanyProfile().upiId) {
        // Ensure grandTotal is formatted to 2 decimal places for UPI
        const am = Number(grandTotal).toFixed(2);
        upiLink = `upi://pay?pa=${getCompanyProfile().upiId}&pn=${encodeURIComponent(getCompanyProfile().name)}&am=${am}&cu=INR`;
    } else if (getCompanyProfile().bankAccountNo && getCompanyProfile().bankIfsc) {
        const am = Number(grandTotal).toFixed(2);
        upiLink = `upi://pay?pa=${getCompanyProfile().bankAccountNo}@${getCompanyProfile().bankIfsc}.ifsc.npci&pn=${encodeURIComponent(getCompanyProfile().name)}&am=${am}&cu=INR`;
    }

    if (upiLink && window.QRCode) {
        try { 
            // Use local QRCode library for faster, offline-capable generation
            const qrDataUrl = await QRCode.toDataURL(upiLink, { width: 150, margin: 1 });
            doc.addImage(qrDataUrl, 'PNG', 95, footerY + 5, 22, 22); // Two lines below (moved down from -5)
            doc.setFontSize(6); doc.text("Scan to Pay", 106, footerY + 29, { align: 'center' });
        } catch(e){
            console.warn("Local QR failed. Fallback to API/Image.", e);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiLink)}`;
            try { 
                doc.addImage(qrUrl, 'PNG', 95, footerY, 20, 20); 
                doc.setFontSize(6); doc.text("Scan to Pay", 105, footerY + 22, { align: 'center' });
            } catch(e2){
                if (getCompanyProfile().qrImage) {
                    try { 
                        const fmt = getCompanyProfile().qrImage.includes('jpeg') ? 'JPEG' : 'PNG';
                        doc.addImage(getCompanyProfile().qrImage, fmt, 95, footerY, 20, 20); 
                        doc.setFontSize(6); doc.text("Scan to Pay", 105, footerY + 22, { align: 'center' });
                    } catch(e3){}
                }
            }
        }
    } else if (getCompanyProfile().qrImage) {
        try { 
            const fmt = getCompanyProfile().qrImage.includes('jpeg') ? 'JPEG' : 'PNG';
            doc.addImage(getCompanyProfile().qrImage, fmt, 95, footerY + 5, 22, 22); 
            doc.setFontSize(6); doc.text("Scan to Pay", 106, footerY + 29, { align: 'center' });
        } catch(e){}
    }

    // Terms & Conditions - Shifted UP to prevent bottom border overflow
    const termsY = Math.max(footerY + 22, bankLastY + 8); 
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("TERMS & CONDITIONS:", 12, termsY);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6);
    const termsText = terms || getCompanyProfile().invoiceTerms || "1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged for delayed payment.";
    const termsLines = doc.splitTextToSize(termsText, 80);
    doc.text(termsLines, 12, termsY + 4);

    // Signatory
    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
    doc.text(`For ${(getCompanyProfile().name) || "EMYRIS BIOLIFESCIENCES"}`, 198, footerY + 2, { align: 'right' });
    if (getCompanyProfile().signatureImage) {
        try { 
            const sigData = getCompanyProfile().signatureImage;
            const fmt = sigData.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(sigData, fmt, 160, footerY + 4, 35, 12); // Slightly larger signature
        } catch(e){}
    }
    doc.text("Authorised Signatory", 198, footerY + 25, { align: 'right' });

    if (filename) doc.save(filename);
    return doc;
}