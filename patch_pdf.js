const fs = require('fs');

let scriptCode = fs.readFileSync('script.js', 'utf8');

// Patch jsPDF resolution
scriptCode = scriptCode.replace(
    /const \{ jsPDF \} = window\.jspdf;/g,
    `const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;`
);

// Fallback for mrp, ptr, pts
scriptCode = scriptCode.replace(
    /inv\.items\.map\(\(it, idx\) => \[\n\s*idx \+ 1/g,
    `inv.items.map((it, idx) => {
            const product = allProducts.find(p => p._id == it.productId || p.id == it.productId);
            const fallbackMrp = product ? product.mrp : 0;
            const fallbackPtr = product ? product.ptr : 0;
            const fallbackPts = product ? product.pts : 0;
            return [
            idx + 1`
);

scriptCode = scriptCode.replace(
    /\(it\.mrp \|\| 0\)\.toFixed\(2\)/g,
    `(it.mrp || fallbackMrp || 0).toFixed(2)`
);

scriptCode = scriptCode.replace(
    /\(it\.qty \* \(it\.priceUsed \|\| it\.rate \|\| 0\)\)\.toFixed\(2\)\n\s*\]\)/g,
    `(it.qty * (it.priceUsed || it.rate || 0)).toFixed(2)
        ]})`
);

fs.writeFileSync('script.js', scriptCode);

let adminCode = fs.readFileSync('admin-script.js', 'utf8');
// Fallback for mrp, ptr, pts in viewInvoicePDF and downloadInvoicePDF
adminCode = adminCode.replace(
    /items: \(inv\.items \|\| \[\]\)\.map\(it => \(\{ \.\.\.it, price: it\.priceUsed \|\| it\.price \|\| 0 \}\)\),/g,
    `items: (inv.items || []).map(it => {
                const product = allProducts.find(p => p._id == it.productId || p.id == it.productId);
                return { 
                    ...it, 
                    price: it.priceUsed || it.price || 0,
                    mrp: it.mrp || (product ? product.mrp : 0),
                    ptr: it.ptr || (product ? product.ptr : 0),
                    pts: it.pts || (product ? product.pts : 0)
                };
            }),`
);
fs.writeFileSync('admin-script.js', adminCode);
console.log("Patched PDF download");
