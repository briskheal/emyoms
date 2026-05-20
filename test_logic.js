const fs = require('fs');

const yThreshold = 0.8;
const anchorY = 1.0;
const anchorToken = { text: 'HSN', y: anchorY, page: 1 };

const calTokens = [
    { text: 'HSN', y: 1.0, page: 1, x: 38, w: 3 },
    { text: 'Paracetamol', y: 2.1, page: 1, x: 10, w: 10 },
    { text: 'B1234', y: 2.2, page: 1, x: 45, w: 5 },
    { text: '12/26', y: 2.15, page: 1, x: 58, w: 4 },
    { text: '100', y: 2.05, page: 1, x: 85, w: 3 },
    { text: 'Amoxicillin', y: 3.5, page: 1, x: 10, w: 10 },
    { text: 'B9999', y: 3.6, page: 1, x: 45, w: 5 },
    { text: '50', y: 3.4, page: 1, x: 85, w: 2 },
];

const pS = 5.0, pE = 35.0;
const hS = 36.0, hE = 42.0;
const bS = 43.0, bE = 55.0;
const eS = 56.0, eE = 64.0;
const mS = 65.0, mE = 72.0;
const rS = 73.0, rE = 82.0;
const qS = 83.0, qE = 95.0;

let rows = [];
let currentY = -1;
let currentRow = [];

const tokens = [...calTokens].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.y - b.y;
});

tokens.forEach(token => {
    if (anchorToken && token.page === 1 && token.y < (anchorY - 0.5)) return;
    
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

        if (checkIn(pS, pE)) {
            productText.push(tok.text);
        } else if (checkIn(hS, hE)) {
            hsnText = tok.text;
        } else if (checkIn(bS, bE)) {
            batchText = tok.text;
        } else if (checkIn(eS, eE)) {
            expText = tok.text;
        } else if (checkIn(mS, mE)) {
            mrpText = tok.text;
        } else if (checkIn(rS, rE)) {
            rateText = tok.text;
        } else if (checkIn(qS, qE)) {
            qtyText = tok.text;
        }
    });

    const name = productText.join(" ").trim().toUpperCase();
    const qty = parseFloat(qtyText) || 0;
    const mrp = parseFloat(mrpText) || 0;
    const rate = parseFloat(rateText) || 0;

    if (name && name.length > 2 && (qty > 0 || mrp > 0 || batchText)) {
        extractedItems.push({ name, batch: batchText, qty });
    }
});

console.log("Extracted items:", extractedItems);
