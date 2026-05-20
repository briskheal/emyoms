const db = require('../models');
const fs = require('fs');
const path = require('path');

async function parseTestPdf() {
    try {
        const PDFParser = require('pdf2json');
        const pdfParser = new PDFParser();
        
        const filePath = path.join(__dirname, '../EMYRIS-OMS-invoice_sample.jpg.PDF');
        if (!fs.existsSync(filePath)) {
            console.error("Sample PDF not found at:", filePath);
            process.exit(1);
        }

        const parsePromise = new Promise((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
            pdfParser.on("pdfParser_dataReady", pdfData => {
                const pages = pdfData.Pages;
                let tokens = [];
                pages.forEach((page, pageIdx) => {
                    const texts = page.Texts;
                    texts.forEach(textObj => {
                        const x = textObj.x;
                        const y = textObj.y;
                        const w = textObj.w;
                        const rawText = decodeURIComponent(textObj.R[0].T);
                        tokens.push({
                            text: rawText.trim(),
                            x: parseFloat(x.toFixed(3)),
                            y: parseFloat(y.toFixed(3)),
                            w: parseFloat(w.toFixed(3)),
                            page: pageIdx + 1
                        });
                    });
                });
                resolve(tokens);
            });
        });

        pdfParser.loadPDF(filePath);
        const tokens = await parsePromise;

        console.log(`Extracted ${tokens.length} tokens.`);
        
        // Find stockist 3 template
        const template = await db.InvoiceTemplate.findOne({ where: { stockistId: 3 } });
        if (!template) {
            console.error("Template not found for stockist 3.");
            process.exit(1);
        }

        console.log("Template:", JSON.stringify(template.toJSON(), null, 2));

        const anchorToken = tokens.find(t => t.text.toUpperCase().includes(template.anchorKeyword.toUpperCase()));
        const anchorY = anchorToken ? anchorToken.y : -1;
        console.log(`Anchor token:`, anchorToken, `AnchorY: ${anchorY}`);

        let rows = [];
        let currentY = -1;
        let currentRow = [];
        let yThreshold = 0.25;

        tokens.sort((a, b) => {
            if (a.page !== b.page) return a.page - b.page;
            return a.y - b.y;
        });

        tokens.forEach(token => {
            if (anchorToken && anchorY >= 0 && token.page === 1 && token.y < anchorY) return;
            
            const lower = token.text.toLowerCase();
            if (lower === 'total' || lower === 'grand total' || lower.includes('for ') || lower.includes('authorized')) return;

            if (currentY === -1 || Math.abs(token.y - currentY) > yThreshold) {
                 if (currentRow.length > 0) {
                     rows.push({ y: currentY, page: token.page, tokens: currentRow });
                 }
                 currentRow = [token];
                 currentY = token.y;
            } else {
                 currentRow.push(token);
            }
        });
        if (currentRow.length > 0) {
            rows.push({ y: currentY, page: tokens[tokens.length - 1].page, tokens: currentRow });
        }

        console.log(`Grouped into ${rows.length} rows.`);

        rows.forEach((row, rowIdx) => {
            console.log(`\n--- Row ${rowIdx + 1} (Y: ${row.y}, Page: ${row.page}) ---`);
            row.tokens.forEach(t => {
                const centerX = t.x + t.w / 2;
                console.log(`  Token: "${t.text}" | x: ${t.x} | w: ${t.w} | centerX: ${centerX.toFixed(2)}`);
            });

            let productText = [];
            let hsnText = "";
            let batchText = "";
            let expText = "";
            let mrpText = "";
            let rateText = "";
            let qtyText = "";

            row.tokens.forEach(tok => {
                const centerX = tok.x + tok.w / 2;
                const inCol = (start, end) => (centerX >= start && centerX <= end);

                if (inCol(template.colProductStart, template.colProductEnd)) {
                    productText.push(tok.text);
                } else if (inCol(template.colHSNStart, template.colHSNEnd)) {
                    hsnText = tok.text;
                } else if (inCol(template.colBatchStart, template.colBatchEnd)) {
                    batchText = tok.text;
                } else if (inCol(template.colExpStart, template.colExpEnd)) {
                    expText = tok.text;
                } else if (inCol(template.colMRPStart, template.colMRPEnd)) {
                    mrpText = tok.text;
                } else if (inCol(template.colRateStart, template.colRateEnd)) {
                    rateText = tok.text;
                } else if (inCol(template.colQtyStart, template.colQtyEnd)) {
                    qtyText = tok.text;
                }
            });

            // HSN Fallback
            if (!hsnText) {
                for (const tok of row.tokens) {
                    const standalone = tok.text.trim().match(/^(\d{6,8})$/);
                    if (standalone) {
                        hsnText = standalone[1];
                        console.log(`    [FALLBACK MATCHED HSN]: "${hsnText}"`);
                        break;
                    }
                }
            }

            console.log(`    Parsed -> Product: "${productText.join(" ")}", HSN: "${hsnText}", Batch: "${batchText}", Exp: "${expText}", MRP: "${mrpText}", Rate: "${rateText}", Qty: "${qtyText}"`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

parseTestPdf();
