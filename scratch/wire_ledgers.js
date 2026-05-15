const fs = require('fs');

// 1. Add jv-entity-list datalist to admin.html
let html = fs.readFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', 'utf8');
html = html.replace(
    '<datalist id="expense-head-list"></datalist>',
    '<datalist id="expense-head-list"></datalist>\n    <datalist id="jv-entity-list"></datalist>'
);
html = html.replace('admin-script.js?v=3.0', 'admin-script.js?v=3.1');
fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/admin.html', html);
console.log('HTML updated. Has jv-entity-list:', html.includes('jv-entity-list'), '| v3.1:', html.includes('v=3.1'));

// 2. Wire loadLedgers into loadMasters in admin-script.js
let js = fs.readFileSync('d:/MY WORK FLOW/EMYOMS/admin-script.js', 'utf8');
const target = 'async function loadMasters() {';
const idx = js.indexOf(target);
if (idx >= 0) {
    // Find the end of loadMasters (next function after it) - just append a loadLedgers() call
    // Instead, find a safe call site - look for where loadMasters() is called
    const callSite = "await loadMasters();\n";
    const callIdx = js.indexOf(callSite);
    if (callIdx >= 0) {
        js = js.slice(0, callIdx + callSite.length) + "    loadLedgers();\n" + js.slice(callIdx + callSite.length);
        fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/admin-script.js', js);
        console.log('JS updated: loadLedgers() hooked after loadMasters()');
    } else {
        // Find initialLoad or init function
        const initCall = 'loadMasters()';
        const allOccurrences = [...js.matchAll(/await loadMasters\(\)/g)];
        console.log('loadMasters occurrences:', allOccurrences.length);
        // Append a call to loadLedgers at the bottom of the script
        js += '\n// Auto-load ledgers on page ready\ndocument.addEventListener("DOMContentLoaded", () => { loadLedgers(); });\n';
        fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/admin-script.js', js);
        console.log('JS updated: loadLedgers() wired via DOMContentLoaded');
    }
} else {
    console.log('loadMasters not found');
}
