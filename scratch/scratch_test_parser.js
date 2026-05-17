const fs = require('fs');

const text = `For: EMYRIS BIOTECH (Logistic Partner to EMYRIS
BIOLIFESCIENCES PVT LTD)
Authorized Signatory
Tax Invoice
Original for Buyer
EMYRIS BIOTECH (Logistic Partner to EMYRIS BIOLIFESCIENCES PVT
LTD)
A-35 1276/A/52 Masiha Park Jaspur Road, Padra, Vadodara
Pin-391440
Pan-LYGPS5699E
Phone no.: 9558816687, 8878923337 Email: emyrisbio@gmail.com
GSTIN: 24LYGPS5699E1ZM, State: 24-Gujarat
Drug License Number: GJ-VAD-229377 / GJ-VAD-229378
FSSAI No.: 20724024000450
Bill To
H.D SALES
B 47 NARENDRA PARK, BEHIND SHIVALAY TEMPLE,
KARELIBAUG, VADODARA
PIN-390018
D.L.No-GJ/VAD/20B/129594, GJ/VAD/21B/129595
FOOD:
Contact No.: 9925043886
GSTIN Number: 24APIPP7077F1ZM
State: 24-Gujarat
Ship To
B 47 NARENDRA PARK, BEHIND SHIVALAY TEMPLE,
KARELIBAUG, VADODARA
PIN-390018
D.L.No-GJ/VAD/20B/129594, GJ/VAD/21B/129595
FOOD:
Invoice Details
Invoice No.: EMY-26-27-0090
Date: 13-05-2026
Place of Supply: 24-Gujarat
Due Date: 12-06-2026
#Item nameHSN/ SACBatch No.Exp. DateMRPQuantityUnit
Price/
Unit
Taxable
amount
CGSTSGSTAmount
1
ASCOCID-1.5GM/6ML
Mfg Name: Protech
Telelinks
30041090
L0942511
A
11/2027309.37210Pcs₹ 100.00₹ 21,000.00
₹ 525.00
(2.5%)
₹ 525.00
(2.5%)
₹ 22,050.00
Total210₹ 21,000.00₹ 525.00₹ 525.00₹ 22,050.00`;

const extractedData = {
    invoiceNo: "",
    date: "",
    customerName: "",
    placeOfSupply: "",
    pincode: "",
    fssaiNo: "",
    email: "",
    items: []
};

// 1. Extract Invoice Number
const invMatch = text.match(/Invoice No\.\s*:\s*([^\n\r]+)/i) || text.match(/Invoice No\s*\.\s*:\s*([^\n\r]+)/i);
if (invMatch) extractedData.invoiceNo = invMatch[1].trim();

// 2. Extract Date & Place of Supply
const dateMatch = text.match(/Date\s*:\s*(\d{2}-\d{2}-\d{4})/i);
if (dateMatch) extractedData.date = dateMatch[1].split('-').reverse().join('-'); // YYYY-MM-DD

const posMatch = text.match(/Place of Supply\s*:\s*([^\n\r]+)/i);
if (posMatch) extractedData.placeOfSupply = posMatch[1].trim().toUpperCase();

// 3. Extract Customer Name & Address
const billToIdx = text.indexOf("Bill To");
if (billToIdx !== -1) {
    const lines = text.substring(billToIdx).split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length > 1) extractedData.customerName = lines[1].toUpperCase();
}

console.log("=== HEADER DETAILS ===");
console.log(extractedData);

console.log("=== PARSING ITEMS ===");
const itemLines = text.split('\n').map(l => l.trim()).filter(l => l);
let capturing = false;

for (let i = 0; i < itemLines.length; i++) {
    const line = itemLines[i];
    
    // Re-detect Header strictly like in Phase 1
    if (line.includes("#Item name") || line.includes("HSN/ SAC") || line.includes("Product Description") || line.includes("Item nameHSN/ SAC")) {
        capturing = true;
        continue;
    }
    if (line.includes("Total") && capturing) break;

    // Start Item Capture: ONLY trigger on sequential small serial numbers when in capturing mode
    const isSerialNumber = /^\d+$/.test(line) && parseInt(line) < 100;

    if (capturing && isSerialNumber) {
        const name = itemLines[i+1] || "";

        // Validate name
        if (!name || name.length < 3 || name === "A" || name === "B" || name.toUpperCase().includes("MFG NAME")) {
            continue;
        }

        let hsn = "", batch = "", expDate = "", mrp = 0, qty = 0, rate = 0, gst = 12;
        
        // Neighborhood scan of next 12 lines
        let neighborhoodLines = [];
        for (let j = i + 1; j < i + 13; j++) {
            if (itemLines[j]) neighborhoodLines.push(itemLines[j]);
        }
        
        // Find HSN (6 to 8 digits)
        const hsnLine = neighborhoodLines.find(l => /^\d{6,8}$/.test(l));
        if (hsnLine) hsn = hsnLine;

        // Find Expiry (without word boundaries to support squashed layouts)
        const expLine = neighborhoodLines.find(l => /(\d{2}\/\d{4})/.test(l) || /(\d{2}\/\d{2})/.test(l));
        if (expLine) {
            const eMatch = expLine.match(/(\d{2}\/\d{4})/) || expLine.match(/(\d{2}\/\d{2})/);
            expDate = eMatch[1];
        }

        // Create a cleaned search space for floats to prevent false decimal merges
        let cleanedSearchText = neighborhoodLines.join(" ");

        if (hsn) {
            cleanedSearchText = cleanedSearchText.replaceAll(hsn, ' ');
        }
        if (expDate) {
            cleanedSearchText = cleanedSearchText.replaceAll(expDate, ' ');
        }

        // 3. Extract Squashed Expiry + MRP + Qty (from original search text first, but with boundary safeguards)
        const squashedMatch = neighborhoodLines.join(" ").match(/(\d{2}\/\d{4})\s*(\d+\.\d{2})(\d+)\s*(Pcs|Box|Tab|Nos|Caps)?/i) || 
                             neighborhoodLines.join(" ").match(/(\d{2}\/\d{2})\s*(\d+\.\d{2})(\d+)\s*(Pcs|Box|Tab|Nos|Caps)?/i);
        if (squashedMatch) {
            expDate = squashedMatch[1];
            mrp = parseFloat(squashedMatch[2]);
            qty = parseInt(squashedMatch[3]);
            
            // Crucial: Wipe out the squashed block from cleanedSearchText to prevent float overlaps
            cleanedSearchText = cleanedSearchText.replaceAll(squashedMatch[0], ' ');
        }

        // 4. Standalone MRP and Quantity Extraction from cleanedSearchText if squashed matching was not found
        if (!mrp) {
            const floatMatch = cleanedSearchText.match(/\b(\d+\.\d{2})\b/);
            if (floatMatch) mrp = parseFloat(floatMatch[1]);
        }
        if (!qty) {
            const intMatch = cleanedSearchText.match(/\b(\d+)\b/g);
            if (intMatch) {
                const validInt = intMatch.find(x => x.length >= 2 && x !== hsn);
                if (validInt) qty = parseInt(validInt);
            }
        }

        // 5. Extract Rate from cleanedSearchText
        // Try to find rate following the Unit / Quantity in the squashed context
        const rateMatch = cleanedSearchText.match(/(?:Pcs|Box|Tab|Nos|Caps)?\s*[^0-9\.]*\s*([\d,]+\.\d{2})/i);
        if (rateMatch) {
            const val = parseFloat(rateMatch[1].replace(/,/g,'').replace(/[^0-9.]/g, ''));
            if (val !== mrp) rate = val;
        }

        // Fallback: If rate is still not found or matches mrp, classify floats
        if (!rate || rate === mrp) {
            const allFloats = [];
            const floatRegex = /\b[\d,]+\.\d{2}\b/g;
            let match;
            while ((match = floatRegex.exec(cleanedSearchText)) !== null) {
                const val = parseFloat(match[0].replace(/,/g, ''));
                if (val !== parseFloat(hsn) && !allFloats.includes(val) && val > 0) {
                    allFloats.push(val);
                }
            }
            if (allFloats.length > 0) {
                allFloats.sort((a, b) => a - b);
                rate = allFloats[0];
                if (!mrp && allFloats.length >= 2) mrp = allFloats[1];
            }
        }

        // 6. Extract Batch Code (Strictly uppercase alphanumeric only!)
        for (let l of neighborhoodLines) {
            const looksLikeBatch = /^[A-Z0-9\-\/]{4,15}$/.test(l) && 
                                  !l.includes(".") && 
                                  l !== hsn && 
                                  !l.includes("%") && 
                                  !l.toUpperCase().includes("GSTIN") &&
                                  !l.toUpperCase().includes("PCS");
            if (looksLikeBatch) {
                batch = l;
                break;
            }
        }

        // 7. Extract GST percentage
        const gstMatch = cleanedSearchText.match(/(\d+\.?\d*)\s*%/);
        if (gstMatch) {
            const val = parseFloat(gstMatch[1]);
            gst = val <= 9 ? val * 2 : val;
        }

        // Fallback Defaults
        if (name && (qty > 0 || mrp > 0 || batch)) {
            extractedData.items.push({
                name: name.toUpperCase(),
                hsn: hsn || "3004",
                batch: batch.toUpperCase() || "EXTRACTED",
                expDate: expDate || "12/2026",
                mrp: mrp || 0,
                qty: qty || 0,
                rate: rate || 0,
                gst: gst || 12
            });
        }

        // Skip lines we parsed
        i++;
    }
}

console.log("=== EXTRACTED ITEMS ===");
console.log(extractedData.items);
