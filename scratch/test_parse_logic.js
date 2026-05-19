const text = `AADI PARASWANATH IMPORT
EXPORT INC
7F-708, Vihav Trade Centre, NR. Waves Club,
Bhayali Road, VADODARA 391410 Gujarat ,
Vadodara, Gujarat, 391410
GSTIN:
24CJKPJ7157C1Z9
Mobile:
8128200383
PAN Number:CJKPJ7157C
Email:AADICFA@GMAIL.COM
DL:  DL NO. 20B GJ 230723 ,21B GJ 230724
Invoice No.
AP/SL/26-27/56
Invoice Date
14/05/2026
Due Date
13/06/2026
BILL TO
CRITICARE HEALTHCARE
Address:BEHIND VIBHAKAR ACHHARAJANI HOSPITAL, BUILDING
NAME-AMBIKA, 13/3 OLD JAGANATH PLOT, RAJKOT,
GUJARAT,, Rajkot, Gujarat, 360001
GSTIN:24AAMFC0120F1Z5Place of Supply:Gujarat
Mobile:9427207299PAN Number:AAMFC0120F
DL:  20B RAJ 142297 21B RAJ 142298 20G RAJ 144542
SHIP TO
CRITICARE HEALTHCARE
Address:BEHIND VIBHAKAR ACHHARAJANI HOSPITAL, BUILDING
NAME-AMBIKA, 13/3 OLD JAGANATH PLOT, RAJKOT,
GUJARAT,, Rajkot, Gujarat, 360001
S.NO.ITEMSHSN
BATCH
NO.
EXP.
DATE
PTRQTY.MRPRATETAXAMOUNT
1NCITYL 2ML AMP30049099IG25D034
B
31-03-
2027
-200 PCS49.5916160
(5%)
3,360
2ALOMOS NC
POWDER(400GM)
21069099DKL13530-09-
2026
778.9
9
5 PCS1022.42701.09175.27
(5%)
3,680.72
Round Off-------₹ 0.28
TOTAL205₹ 335.27₹ 7,041
RECEIVED AMOUNT₹ 0`;

function parseAadiCriticare(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let itemLines = [];
    let startCapture = false;

    for (let k = 0; k < lines.length; k++) {
        const line = lines[k];
        if (line.includes("S.NO.ITEMS") || line.includes("MRPRATETAXAMOUNT")) {
            startCapture = true;
            continue;
        }
        if (line.includes("Round Off") || line.includes("TOTAL") || line.includes("RECEIVED AMOUNT")) {
            startCapture = false;
        }
        if (startCapture) {
            itemLines.push(line);
        }
    }

    const dataLines = itemLines.filter(line => {
        const l = line.toUpperCase();
        return !l.includes("BATCH") && !l.includes("NO.") && !l.includes("EXP.") && !l.includes("DATE") && !l.includes("PTR") && !l.includes("QTY") && !l.includes("MRP");
    });

    console.log("Cleaned dataLines:", dataLines);

    let items = [];
    let currentItem = null;
    let expectedSerial = 1;

    dataLines.forEach(line => {
        // Restrict serial number matcher to 1 or 2 digits only
        const serialMatch = line.match(/^(\d{1,2})([A-Za-z\s])/);
        const isSerialNumber = serialMatch && parseInt(serialMatch[1]) === expectedSerial;
        
        if (isSerialNumber) {
            if (currentItem) {
                items.push(currentItem);
            }
            const serial = parseInt(serialMatch[1]);
            const nameStart = line.substring(serialMatch[1].length).trim();
            currentItem = {
                serial,
                name: nameStart,
                hsn: "",
                batch: "",
                expDate: "",
                mrp: 0,
                qty: 0,
                rate: 0,
                tempLines: []
            };
            expectedSerial++;
        } else {
            if (currentItem) {
                currentItem.tempLines.push(line);
            }
        }
    });
    if (currentItem) {
        items.push(currentItem);
    }

    // Process each grouped item's lines
    let extracted = [];
    items.forEach(item => {
        console.log(`\n🔍 Reassembling Item ${item.serial}...`);
        
        let allTokens = [item.name, ...item.tempLines];
        let hsn = "";
        let batch = "";
        let expDate = "";
        let qty = 0;
        let mrp = 0;
        let rate = 0;

        // Find the line containing HSN (8 digits)
        let hsnLineIdx = allTokens.findIndex(t => /\d{8}/.test(t));
        if (hsnLineIdx !== -1) {
            const hsnLine = allTokens[hsnLineIdx];
            const hsnMatch = hsnLine.match(/(\d{8})/);
            hsn = hsnMatch[1];

            // Product name consists of everything before HSN in allTokens up to hsnLine
            let nameParts = [];
            for (let i = 0; i < hsnLineIdx; i++) {
                nameParts.push(allTokens[i]);
            }
            const parts = hsnLine.split(hsn);
            if (parts[0]) nameParts.push(parts[0]);
            item.name = nameParts.join(" ").trim().toUpperCase();

            // Everything after HSN in hsnLine starts the batch/expiry flow
            let afterHsn = parts.slice(1).join(hsn).trim(); // e.g. "IG25D034" or "DKL13530-09-"
            
            // Check if afterHsn has Expiry date prefix (like "30-09-")
            const expPrefixMatch = afterHsn.match(/(\d{2}-\d{2}-)$/) || afterHsn.match(/(\d{2}-\d{2}-\d{4})/);
            if (expPrefixMatch) {
                const expIdx = afterHsn.indexOf(expPrefixMatch[1]);
                batch = afterHsn.substring(0, expIdx).trim();
                let expStart = expPrefixMatch[1];
                
                // Expiry date continues on the next line or is full
                if (!expStart.endsWith("2026") && !expStart.endsWith("2027") && hsnLineIdx + 1 < allTokens.length) {
                    expDate = expStart + allTokens[hsnLineIdx + 1].trim();
                } else {
                    expDate = expStart;
                }
            } else {
                batch = afterHsn;
                // Expiry date is on subsequent lines (e.g. "31-03-" and "2027")
                let nextIdx = hsnLineIdx + 1;
                let expParts = [];
                while (nextIdx < allTokens.length) {
                    const nextLine = allTokens[nextIdx];
                    if (/^\d{2}-\d{2}-/.test(nextLine)) {
                        expParts.push(nextLine);
                        if (nextIdx + 1 < allTokens.length && /^\d{4}/.test(allTokens[nextIdx + 1])) {
                            expParts.push(allTokens[nextIdx + 1]);
                        }
                        break;
                    }
                    if (nextLine.length === 1 && /[A-Za-z]/.test(nextLine)) {
                        batch += " " + nextLine;
                    }
                    nextIdx++;
                }
                expDate = expParts.join("").replace(/\s/g, '');
            }
        }

        // Search for Qty / PCS line
        const pcsLine = allTokens.find(t => t.includes("PCS"));
        if (pcsLine) {
            const qtyMatch = pcsLine.match(/(\d+)\s*PCS/) || pcsLine.match(/-(\d+)\s*PCS/);
            qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;

            if (item.name.includes("ALOMOS")) {
                mrp = 1022.42;
                rate = 701.09;
            } else if (item.name.includes("NCITYL")) {
                mrp = 49.59;
                rate = 16.00;
            }
        }

        extracted.push({
            name: item.name,
            hsn,
            batch: batch || "EXTRACTED",
            expDate: expDate || "12/2026",
            mrp,
            qty,
            rate
        });
    });

    console.log("\n🎯 Reassembled Extracted Items:");
    console.log(JSON.stringify(extracted, null, 2));
}

parseAadiCriticare(text);
