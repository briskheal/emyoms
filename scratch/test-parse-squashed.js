function parseSquashedLine(line) {
    const hsnMatch = line.match(/^(\d{4}|\d{8})(?=[A-Za-z])/);
    if (!hsnMatch) return null;

    const hsn = hsnMatch[1];
    let remaining = line.substring(hsn.length);

    const expMatch = remaining.match(/\b(\d{1,2}\/\d{2,4})\b/) || remaining.match(/(\d{1,2}\/\d{2,4})/);
    if (!expMatch) return null;

    const expDate = expMatch[1];
    const expIdx = remaining.indexOf(expDate);

    const leftSide = remaining.substring(0, expIdx).trim();
    const rightSide = remaining.substring(expIdx + expDate.length).trim();

    const parts = rightSide.split(/\s+/).filter(p => p);
    if (parts.length < 3) return null;

    const cleanNum = (txt) => parseFloat(txt.replace(/,/g, '').replace(/[^0-9.]/g, '')) || 0;
    
    const mrp = cleanNum(parts[0]);
    const qty = parseInt(parts[1]) || 0;
    const rate = cleanNum(parts[2]);
    const gst = parts.length >= 5 ? parseInt(parts[4]) || 5 : 5;

    const batchMatch = leftSide.match(/([A-Z0-9\-]{4,15})$/i);
    let batch = "EXTRACTED";
    let name = leftSide;
    if (batchMatch) {
        batch = batchMatch[1];
        name = leftSide.substring(0, leftSide.length - batch.length).trim();

        const injMatch = batch.match(/^(INJ(?:ECTION)?)(.+)$/i);
        if (injMatch) {
            name = (name + " " + injMatch[1]).trim();
            batch = injMatch[2];
        }
    }

    name = name.replace(/^EMYRI\d?\s*(VIAL|TAB|CAP|PCS|BOX|NOS)?/i, '').trim();

    return {
        name: name.toUpperCase(),
        hsn,
        batch: batch.toUpperCase(),
        expDate,
        mrp,
        qty,
        rate,
        gst
    };
}

const line = "30042019EMYRI1 VIALEMYCEF 1.5GM INJD0362612C2/28 330.00 5015 30.00 0.00 5 157972.50";
const result = parseSquashedLine(line);
console.log(JSON.stringify(result, null, 2));
