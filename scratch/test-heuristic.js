const text = `Sn.HSNPackProductCompBatch Exp.MRPQtyFreeRate
Dis %
GST%
Amount
1.
30042019EMYRI1 VIALEMYCEF 1.5GM INJD0362612C2/28 330.00 5015 30.00 0.00 5 157972.50
SUB TOTAL
150450.00`;

function testHeuristic() {
    let rawLines = text.split('\n').map(l => l.trim()).filter(l => l);
    let itemLines = [];
    for (let k = 0; k < rawLines.length; k++) {
        let line = rawLines[k];
        itemLines.push(line);
    }

    let capturing = false;
    let expectedSerial = 1;
    let extractedItems = [];

    for (let i = 0; i < itemLines.length; i++) {
        const line = itemLines[i];
        
        if (line.includes("Sn.HSNPackProductComp") || line.includes("HSN") || line.includes("Product")) {
            capturing = true;
            continue;
        }

        const isSerialNumber = /^\d+\.$/.test(line) || (/^\d+$/.test(line) && parseInt(line) === expectedSerial);
        console.log(`Line ${i}: "${line}" | capturing: ${capturing} | isSerialNumber: ${isSerialNumber}`);

        if (capturing && isSerialNumber) {
            let name = "";
            let nextLine = itemLines[i+1] || "";
            console.log(`  Found Serial! Next line: "${nextLine}"`);

            // Find HSN, Batch, Exp, MRP, Qty, Rate from nextLine
            let hsn = "", batch = "", expDate = "", mrp = 0, qty = 0, rate = 0, gst = 12;
            
            // Let's test the regexes on:
            // "30042019EMYRI1 VIALEMYCEF 1.5GM INJD0362612C2/28 330.00 5015 30.00 0.00 5 157972.50"
            
            // Search for 4, 6, or 8 digit HSN code
            const hsnMatch = nextLine.match(/\b(\d{4}|\d{6}|\d{8})\b/) || nextLine.match(/^(\d{4}|\d{6}|\d{8})/);
            if (hsnMatch) {
                hsn = hsnMatch[1];
                console.log(`    Parsed HSN: "${hsn}"`);
            }

            // Expiry Date (pattern like MM/YY or MM/YYYY or M/YY or M/YYYY)
            // e.g. 2/28 or 02/2028 or 12/28
            const expMatch = nextLine.match(/\b(\d{1,2}\/\d{2,4})\b/);
            if (expMatch) {
                expDate = expMatch[1];
                console.log(`    Parsed Exp: "${expDate}"`);
            }

            // Floats in the line:
            // "30042019EMYRI1 VIALEMYCEF 1.5GM INJD0362612C2/28 330.00 5015 30.00 0.00 5 157972.50"
            // The floats are: 330.00, 30.00, 0.00, 157972.50
            const floats = nextLine.match(/\b\d+\.\d{2}\b/g) || [];
            console.log(`    Parsed floats:`, floats);

            // Ints in the line (standalone):
            // 5015, 5
            const ints = nextLine.replace(/\b\d+\.\d{2}\b/g, ' ').match(/\b\d+\b/g) || [];
            console.log(`    Parsed ints:`, ints);
        }
    }
}

testHeuristic();
