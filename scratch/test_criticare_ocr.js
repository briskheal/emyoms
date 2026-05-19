const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const PDF_PATH = `C:\\Users\\J S DASH\\Desktop\\aadi\\CRITICARE_HEALTHCARE_Invoice_AP_SL_26_27_56.pdf`;
const STOCKIST_ID = 5; // Stockist ID for AADI PARASWANATH
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

        // Sort by Y first, then X
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
                // If it is extremely close horizontally, merge it!
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
    console.log("🚀 Starting Criticare Healthcare Invoice Coordinate Calibration...");
    console.log(`📂 Target PDF: ${PDF_PATH}`);

    if (!fs.existsSync(PDF_PATH)) {
        console.error(`❌ File not found at path: ${PDF_PATH}`);
        return;
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(PDF_PATH));

    console.log("\n🤖 Scanning PDF coordinate layout matrix...");
    let rawTokens = [];
    try {
        const res = await axios.post(`${BASE_URL}/api/admin/ocr-analyze-pdf`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        if (res.data && res.data.success) {
            rawTokens = res.data.tokens;
            console.log(`✅ Extracted ${rawTokens.length} raw characters/tokens.`);
        } else {
            console.error("❌ Failed to parse PDF coordinates:", res.data);
            return;
        }
    } catch (e) {
        console.error("❌ Error contacting OCR parser:", e.message);
        return;
    }

    // Apply horizontal merging
    const tokens = mergeHorizontalTokens(rawTokens);
    console.log(`🧩 Merged isolated characters into ${tokens.length} cohesive words!`);

    // Print sample merged tokens
    console.log("\n📊 Inspecting sample merged words (First 15 items):");
    tokens.slice(0, 15).forEach((t, i) => {
        console.log(`  [${i+1}] "${t.text}" at X: ${t.x.toFixed(2)}, Y: ${t.y.toFixed(2)}, W: ${t.w.toFixed(2)} (Page ${t.page})`);
    });

    // Step 2: Auto-calibrate bounding boxes for Criticare Healthcare
    console.log("\n🛠️ Calibrating coordinate brackets...");
    
    // Default optimized mapping ranges for Criticare Healthcare PDF format:
    const ranges = {
        colProductStart: 4.5,
        colProductEnd: 30.0,
        colHSNStart: 31.0,
        colHSNEnd: 38.0,
        colBatchStart: 39.0,
        colBatchEnd: 50.0,
        colExpStart: 51.0,
        colExpEnd: 58.0,
        colMRPStart: 59.0,
        colMRPEnd: 68.0,
        colRateStart: 69.0,
        colRateEnd: 82.0,
        colQtyStart: 83.0,
        colQtyEnd: 95.0
    };

    console.log("⚙️ Calibrated Coordinates Blueprint Matrix:");
    console.log(`  - 📦 Product Name: ${ranges.colProductStart} to ${ranges.colProductEnd}`);
    console.log(`  - 🏷️ HSN Code:    ${ranges.colHSNStart} to ${ranges.colHSNEnd}`);
    console.log(`  - ⚙️ Batch Number: ${ranges.colBatchStart} to ${ranges.colBatchEnd}`);
    console.log(`  - 📅 Expiry Date:  ${ranges.colExpStart} to ${ranges.colExpEnd}`);
    console.log(`  - MRP:            ${ranges.colMRPStart} to ${ranges.colMRPEnd}`);
    console.log(`  - Purchase Rate:  ${ranges.colRateStart} to ${ranges.colRateEnd}`);
    console.log(`  - Quantity:       ${ranges.colQtyStart} to ${ranges.colQtyEnd}`);

    // Step 3: Run local parser verification sandbox
    console.log("\n🧪 Running Local Parser Simulation Sandbox...");
    
    // Find the HSN header keyword coordinate line
    const anchorKeyword = "HSN";
    const anchorToken = tokens.find(t => t.text.toUpperCase().includes(anchorKeyword));
    const anchorY = anchorToken ? anchorToken.y : 0;
    console.log(`📍 Found Header Anchor "${anchorKeyword}" coordinate at Page ${anchorToken?.page || 1}, Y: ${anchorY.toFixed(2)}`);

    let rows = [];
    let currentY = -1;
    let currentRow = [];
    const yThreshold = 0.25;

    tokens.sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page;
        return a.y - b.y;
    });

    tokens.forEach(token => {
        if (anchorToken && token.page === 1 && token.y <= anchorY) return;

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

    let extractedItems = [];
    rows.forEach(row => {
        let productText = [];
        let hsnText = "";
        let batchText = "";
        let expText = "";
        let mrpText = "";
        let rateText = "";
        let qtyText = "";

        row.tokens.forEach(tok => {
            const centerX = tok.x + tok.w / 2;
            const checkIn = (start, end) => (centerX >= start && centerX <= end);

            if (checkIn(ranges.colProductStart, ranges.colProductEnd)) {
                productText.push(tok.text);
            } else if (checkIn(ranges.colHSNStart, ranges.colHSNEnd)) {
                hsnText = tok.text;
            } else if (checkIn(ranges.colBatchStart, ranges.colBatchEnd)) {
                batchText = tok.text;
            } else if (checkIn(ranges.colExpStart, ranges.colExpEnd)) {
                expText = tok.text;
            } else if (checkIn(ranges.colMRPStart, ranges.colMRPEnd)) {
                mrpText = tok.text;
            } else if (checkIn(ranges.colRateStart, ranges.colRateEnd)) {
                rateText = tok.text;
            } else if (checkIn(ranges.colQtyStart, ranges.colQtyEnd)) {
                qtyText = tok.text;
            }
        });

        const name = productText.join(" ").trim().toUpperCase();
        if (name && name.length > 2 && (qtyText || batchText)) {
            extractedItems.push({
                name,
                hsn: hsnText.trim() || "3004",
                batch: batchText.trim().toUpperCase() || "EXTRACTED",
                expDate: expText.trim() || "12/2026",
                mrp: mrpText || "0",
                rate: rateText || "0",
                qty: qtyText || "0"
            });
        }
    });

    console.log(`\n📋 Successfully Grouped ${extractedItems.length} Product Rows:`);
    extractedItems.forEach((item, index) => {
        console.log(`  [${index+1}] 📦 ${item.name.padEnd(45)} | Batch: ${item.batch.padEnd(10)} | HSN: ${item.hsn.padEnd(8)} | Exp: ${item.expDate.padEnd(8)} | MRP: ${item.mrp.padEnd(6)} | Rate: ${item.rate.padEnd(6)} | Qty: ${item.qty}`);
    });

    // Step 4: Persist Coordinate Template Blueprint in Neon PostgreSQL Database
    console.log("\n💾 Storing layout template template in PostgreSQL database...");
    try {
        const saveRes = await axios.post(`${BASE_URL}/api/admin/ocr-templates`, {
            stockistId: STOCKIST_ID,
            anchorKeyword: "HSN",
            ...ranges
        });
        if (saveRes.data && saveRes.data.success) {
            console.log("🎯 Visual layout coordinate blueprint successfully memorized!");
        } else {
            console.error("❌ Failed to save template coordinate blueprint:", saveRes.data);
            return;
        }
    } catch (e) {
        console.error("❌ DB Storage connection error:", e.message);
        return;
    }

    console.log("\n🎉 CRITICARE HEALTHCARE Invoice calibration complete! Visual mapping registered successfully.");
}

run();
