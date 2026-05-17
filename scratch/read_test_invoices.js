const fs = require('fs');
const pdf = require('pdf-parse');

function runFallbackParser(text) {
    const extractedData = {
        invoiceNo: "",
        date: "",
        customerName: "",
        placeOfSupply: "",
        items: []
    };

    // 1. Extract Invoice Number
    const invMatch = text.match(/Invoice No\.\s*:\s*([^\n\r]+)/i) || text.match(/Invoice No\s*\.\s*:\s*([^\n\r]+)/i);
    if (invMatch) extractedData.invoiceNo = invMatch[1].trim();

    // 2. Extract Date & Place of Supply
    const dateMatch = text.match(/Date\s*:\s*(\d{2}-\d{2}-\d{4})/i) || text.match(/Invoice Date\s*:\s*(\d{2}-\d{2}-\d{4})/i);
    if (dateMatch) extractedData.date = dateMatch[1].split('-').reverse().join('-'); // YYYY-MM-DD

    const posMatch = text.match(/Place of Supply\s*:\s*([^\n\r]+)/i);
    if (posMatch) extractedData.placeOfSupply = posMatch[1].trim().toUpperCase();

    // 3. Extract Customer Name & Address
    const billToIdx = text.indexOf("Bill To");
    if (billToIdx !== -1) {
        const lines = text.substring(billToIdx).split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length > 1) extractedData.customerName = lines[1].toUpperCase();
    }

    // Split text into lines and clean them
    let rawLines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // HEALING PHASE 1: Reconnect split HSN and split decimals/floats
    let itemLines = [];
    for (let k = 0; k < rawLines.length; k++) {
        let line = rawLines[k];
        
        // Match split HSN (e.g. "2106909" followed by "9")
        if (/^\d{7}$/.test(line) && k + 1 < rawLines.length && /^\d{1}$/.test(rawLines[k+1])) {
            line = line + rawLines[k+1];
            k++; // Skip next line since we merged it
        }
        // Match split float decimal (e.g. "1349.0" followed by "0")
        else if (/^\d+\.\d$/.test(line) && k + 1 < rawLines.length && /^\d{1}$/.test(rawLines[k+1])) {
            line = line + rawLines[k+1];
            k++;
        }
        itemLines.push(line);
    }

    let capturing = false;
    let extractedItems = [];
    let expectedSerial = 1;

    for (let i = 0; i < itemLines.length; i++) {
        const line = itemLines[i];
        
        if (line.includes("#Item name") || line.includes("HSN/ SAC") || line.includes("Product Description") || line.includes("Item nameHSN/ SAC")) {
            capturing = true;
            continue;
        }
        if (line.includes("Total") && capturing) break;

        const isSerialNumber = /^\d+$/.test(line) && parseInt(line) === expectedSerial;

        if (capturing && isSerialNumber) {
            // Reconstruct product name: combine consecutive alphabetic lines (which don't start with Mfg Name)
            let nameParts = [];
            let nextIdx = i + 1;
            while (nextIdx < itemLines.length) {
                const nextLine = itemLines[nextIdx];
                if (nextLine.toUpperCase().includes("MFG NAME") || 
                    /^\d{6,8}$/.test(nextLine) || 
                    /\d{2}\/\d{2,4}/.test(nextLine) || 
                    /^\d+$/.test(nextLine)) {
                    break;
                }
                if (/[a-zA-Z]/.test(nextLine)) {
                    nameParts.push(nextLine);
                }
                nextIdx++;
            }
            
            let name = nameParts.join(" ").trim();
            if (!name) name = itemLines[i+1] || "";

            let hsn = "", batch = "", expDate = "", mrp = 0, qty = 0, rate = 0, gst = 12;
            let isDateFirst = false;
            
            let neighborhoodLines = [];
            for (let j = i + 1; j < i + 18; j++) {
                if (itemLines[j]) neighborhoodLines.push(itemLines[j]);
            }
            
            // Extract HSN
            const hsnLine = neighborhoodLines.find(l => /^\d{6,8}$/.test(l));
            if (hsnLine) hsn = hsnLine;

            // Find squashed line (strictly contains exp date pattern xx/xxxx or xx/xx)
            let squashedLine = neighborhoodLines.find(l => /\d{2}\/\d{2,4}/.test(l));
            
            let cleanedSearchText = neighborhoodLines.join(" ");

            if (squashedLine) {
                isDateFirst = /^\d{2}\//.test(squashedLine);
                
                if (isDateFirst) {
                    // Pattern 1: Starts with Expiry (e.g. "11/2027309.3745Pcs₹ 100.00₹ 4,500.00")
                    const formatMatch = squashedLine.match(/^(\d{2}\/\d{2,4})\s*(\d+\.\d{2})(\d+)\s*(Pcs|Box|Tab|Nos|Caps|Btl|Vial)/i);
                    if (formatMatch) {
                        expDate = formatMatch[1];
                        mrp = parseFloat(formatMatch[2]);
                        qty = parseInt(formatMatch[3]);
                        
                        // Remaining part to scan for rate
                        let remaining = squashedLine.replace(formatMatch[0], ' ');
                        const floatRegex = /\b[\d,]+\.\d{2}\b/g;
                        let match;
                        const patternFloats = [];
                        while ((match = floatRegex.exec(remaining)) !== null) {
                            const val = parseFloat(match[0].replace(/,/g, ''));
                            if (val > 0 && val !== mrp) {
                                patternFloats.push(val);
                            }
                        }
                        if (patternFloats.length > 0) {
                            patternFloats.sort((a, b) => a - b);
                            rate = patternFloats[0];
                        }
                    }
                } else {
                    // Pattern 2: Starts with PTR (e.g. "342.46DKT25004/2027450.0020Btl" or "1027.81DKL37909/2027")
                    const formatMatch = squashedLine.match(/^([\d\.,]+)\s*([A-Z0-9\-]{4,12})\s*(\d{2}\/\d{2,4})\s*(?:(\d+\.\d{2})(\d+)\s*(Pcs|Box|Tab|Nos|Caps|Btl|Vial)?)?/i);
                    if (formatMatch) {
                        rate = parseFloat(formatMatch[1].replace(/,/g, ''));
                        batch = formatMatch[2];
                        expDate = formatMatch[3];
                        if (formatMatch[4]) mrp = parseFloat(formatMatch[4]);
                        if (formatMatch[5]) qty = parseInt(formatMatch[5]);
                    }
                }
            }

            let ptr = rate; // Save the squashed rate as PTR reference

            // Expiry Date fallback
            if (!expDate) {
                const expLine = neighborhoodLines.find(l => /(\d{2}\/\d{4})/.test(l) || /(\d{2}\/\d{2})/.test(l));
                if (expLine) {
                    const eMatch = expLine.match(/(\d{2}\/\d{4})/) || expLine.match(/(\d{2}\/\d{2})/);
                    expDate = eMatch[1];
                }
            }

            // Clean search text
            if (hsn) cleanedSearchText = cleanedSearchText.replaceAll(hsn, ' ');
            if (expDate) cleanedSearchText = cleanedSearchText.replaceAll(expDate, ' ');
            if (squashedLine) cleanedSearchText = cleanedSearchText.replaceAll(squashedLine, ' ');
            if (batch) cleanedSearchText = cleanedSearchText.replaceAll(batch, ' ');

            // Quantity fallback
            if (!qty) {
                const qtyUnitLine = neighborhoodLines.find(l => /^\d+(?:Pcs|Box|Tab|Nos|Caps|Btl|Vial)/i.test(l));
                if (qtyUnitLine) {
                    const qm = qtyUnitLine.match(/^(\d+)/);
                    if (qm) qty = parseInt(qm[1]);
                }
            }
            if (!qty) {
                const intMatch = cleanedSearchText.match(/\b(\d+)\b/g);
                if (intMatch) {
                    const validInt = intMatch.find(x => x.length >= 2 && x !== hsn);
                    if (validInt) qty = parseInt(validInt);
                }
            }

            // MRP fallback (exclude already isolated PTR)
            if (!mrp) {
                const floatRegex = /\b(\d+\.\d{2})\b/g;
                let match;
                while ((match = floatRegex.exec(cleanedSearchText)) !== null) {
                    const val = parseFloat(match[0]);
                    if (val !== ptr && val > 0) {
                        mrp = val;
                        break;
                    }
                }
            }

            // Collect all floats in the neighborhood for validation
            const floatRegexAll = /\b[\d,]+\.\d{2}\b/g;
            let matchAll;
            const neighborhoodFloats = [];
            const fullTextCleaned = neighborhoodLines.join(" ");
            while ((matchAll = floatRegexAll.exec(fullTextCleaned)) !== null) {
                const val = parseFloat(matchAll[0].replace(/,/g, ''));
                if (val > 0 && !neighborhoodFloats.includes(val)) {
                    neighborhoodFloats.push(val);
                }
            }

            // Perform mathematical validation check only for Pattern 2 (non-date first squashed lines)
            if (!isDateFirst && qty > 0) {
                const allFloats = [];
                floatRegexAll.lastIndex = 0; // reset
                while ((matchAll = floatRegexAll.exec(fullTextCleaned)) !== null) {
                    const val = parseFloat(matchAll[0].replace(/,/g, ''));
                    if (val !== parseFloat(hsn) && val !== mrp && val !== ptr && val > 0) {
                        const idx = matchAll.index;
                        const contextAfter = fullTextCleaned.substring(idx, idx + 25);
                        if (contextAfter.includes("%") || contextAfter.includes("(") || contextAfter.includes("CGST") || contextAfter.includes("SGST")) {
                            continue; // Skip tax amount floats
                        }
                        if (!allFloats.includes(val)) {
                            allFloats.push(val);
                        }
                    }
                }

                let verifiedRate = allFloats.find(r => 
                    neighborhoodFloats.some(f => Math.abs(r * qty - f) < 1.0)
                );
                if (!verifiedRate && ptr > 0 && neighborhoodFloats.some(f => Math.abs(ptr * qty - f) < 1.0)) {
                    verifiedRate = ptr;
                }

                if (verifiedRate) {
                    rate = verifiedRate;
                } else {
                    if (allFloats.length > 0) {
                        allFloats.sort((a, b) => a - b);
                        rate = allFloats[0];
                    } else if (!rate) {
                        rate = ptr;
                    }
                }
            }

            // Batch code fallback
            if (!batch) {
                for (let l of neighborhoodLines) {
                    const looksLikeBatch = /^[A-Z0-9\-\/]{4,15}$/.test(l) && 
                                          !l.includes(".") && 
                                          l !== hsn && 
                                          !l.includes("%") && 
                                          !l.toUpperCase().includes("GSTIN") &&
                                          !l.toUpperCase().includes("PCS") &&
                                          !l.toUpperCase().includes("VIAL") &&
                                          !name.includes(l.toUpperCase());
                    if (looksLikeBatch) {
                        batch = l;
                        break;
                    }
                }
            }

            // GST extract
            const gstMatch = cleanedSearchText.match(/(\d+\.?\d*)\s*%/);
            if (gstMatch) {
                const val = parseFloat(gstMatch[1]);
                gst = val <= 9 ? val * 2 : val;
            } else {
                const cgstMatch = neighborhoodLines.join(" ").match(/(\d+\.?\d*)\s*%\s*\)/) || neighborhoodLines.join(" ").match(/\(\s*(\d+\.?\d*)\s*%\s*\)/);
                if (cgstMatch) {
                    const val = parseFloat(cgstMatch[1]);
                    gst = val * 2;
                }
            }

            if (name && (qty > 0 || mrp > 0 || batch)) {
                extractedItems.push({
                    name: name.toUpperCase(),
                    hsn: hsn || "3004",
                    batch: (batch || "EXTRACTED").toUpperCase(),
                    expDate: expDate || "12/2026",
                    mrp: mrp || 0,
                    qty: qty || 0,
                    rate: rate || 0,
                    gst: gst || 12
                });
                expectedSerial++;
            }
            i++; 
        }
    }
    extractedData.items = extractedItems;
    return extractedData;
}

async function analyzeInvoice(filepath, name) {
    console.log(`\n======================================================`);
    console.log(`=== ANALYZING ${name}: ${filepath}`);
    console.log(`======================================================`);
    try {
        const buffer = fs.readFileSync(filepath);
        const data = await pdf(buffer);
        
        const result = runFallbackParser(data.text);
        console.log(`--- PARSED DATA ---`);
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(`Error parsing ${name}:`, err);
    }
}

async function main() {
    await analyzeInvoice('C:\\Users\\J S DASH\\Desktop\\HD TEST INVOICE-2.pdf', 'HD SALES 2');
    await analyzeInvoice('C:\\Users\\J S DASH\\Desktop\\HD TEST INVOICE-3.pdf', 'HD SALES 3');
}

main();
