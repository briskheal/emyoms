const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const PDF_PATH = `C:\\Users\\J S DASH\\Desktop\\aadi\\CRITICARE_HEALTHCARE_Invoice_AP_SL_26_27_56.pdf`;
const BASE_URL = 'http://localhost:5000';

function mergeHorizontalTokens(rawTokens) {
    let pagesMap = {};
    rawTokens.forEach(t => {
        if (!pagesMap[t.page]) pagesMap[t.page] = [];
        pagesMap[t.page].push(t);
    });

    let mergedTokens = [];

    Object.keys(pagesMap).forEach(pageStr => {
        const page = parseInt(pageStr);
        let pageTokens = pagesMap[page];

        pageTokens.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 0.05) {
                return a.y - b.y;
            }
            return a.x - b.x;
        });

        let currentMerged = null;

        pageTokens.forEach(tok => {
            if (!currentMerged) {
                currentMerged = { ...tok };
            } else {
                const sameY = Math.abs(tok.y - currentMerged.y) <= 0.05;
                const adjacentX = (tok.x - (currentMerged.x + currentMerged.w)) <= 0.35; 

                if (sameY && adjacentX) {
                    currentMerged.text += tok.text;
                    currentMerged.w = (tok.x + tok.w) - currentMerged.x;
                } else {
                    mergedTokens.push(currentMerged);
                    currentMerged = { ...tok };
                }
            }
        });
        if (currentMerged) {
            mergedTokens.push(currentMerged);
        }
    });

    return mergedTokens;
}

async function run() {
    console.log("🔍 Extracting and listing all merged tokens...");
    const form = new FormData();
    form.append('file', fs.createReadStream(PDF_PATH));

    try {
        const res = await axios.post(`${BASE_URL}/api/admin/ocr-analyze-pdf`, form, {
            headers: form.getHeaders()
        });
        
        if (res.data && res.data.success) {
            const merged = mergeHorizontalTokens(res.data.tokens);
            console.log(`✅ Total merged tokens: ${merged.length}`);
            
            // Print all tokens containing "HSN" or "BATCH" or "PRODUCT" or "RATE" or "QTY"
            console.log("\n🎯 Matches for common invoice keywords:");
            merged.forEach(t => {
                const txt = t.text.toUpperCase();
                if (txt.includes("HSN") || txt.includes("BATCH") || txt.includes("PRODUCT") || txt.includes("MRP") || txt.includes("RATE") || txt.includes("QTY") || txt.includes("INVOICE")) {
                    console.log(`  - "${t.text}" at X: ${t.x.toFixed(2)}, Y: ${t.y.toFixed(2)}, W: ${t.w.toFixed(2)}`);
                }
            });
            
            console.log("\n📑 Full List of Merged Tokens with Length > 4:");
            merged.filter(t => t.text.replace(/G/g, '').length > 4).forEach((t, i) => {
                console.log(`  [${i+1}] "${t.text}" (Cleaned: "${t.text.replace(/G/g, ' ')}") at X: ${t.x.toFixed(2)}, Y: ${t.y.toFixed(2)}, W: ${t.w.toFixed(2)}`);
            });
        }
    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

run();
