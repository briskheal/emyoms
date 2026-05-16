const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(filePath, 'utf8');

// Replace the ID and table headers
const oldHtml = `<table class="modern-table">
                            <thead>
                                <tr>
                                    <th style="width: 100px;">JV NO</th>
                                    <th style="width: 100px;">DATE</th>
                                    <th>NARRATION</th>
                                    <th style="text-align: right; width: 150px;">TOTAL (&#8377;)</th>
                                </tr>
                            </thead>
                            <tbody id="jv-grid-body">
                                <tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading JVs...</td></tr>
                            </tbody>
                        </table>`;

const newHtml = `<table class="modern-table">
                            <thead>
                                <tr>
                                    <th style="width: 100px;">JV NO</th>
                                    <th style="width: 100px;">DATE</th>
                                    <th>NARRATION</th>
                                    <th style="text-align: right; width: 120px;">DR (&#8377;)</th>
                                    <th style="text-align: right; width: 120px;">CR (&#8377;)</th>
                                    <th style="width: 120px; text-align: center;">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody id="jv-grid-body">
                                <tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading JVs...</td></tr>
                            </tbody>
                        </table>`;

if (html.includes(oldHtml)) {
    html = html.replace(oldHtml, newHtml);
    fs.writeFileSync(filePath, html);
    console.log('Successfully updated admin.html table structure');
} else {
    console.log('Old HTML string not found in admin.html');
}

const jsPath = path.join(__dirname, '..', 'admin-script.js');
let script = fs.readFileSync(jsPath, 'utf8');

const oldJs = `const tbody = document.getElementById('jvs-grid');`;
const newJs = `const tbody = document.getElementById('jv-grid-body');`;

if (script.includes(oldJs)) {
    script = script.replace(oldJs, newJs);
    fs.writeFileSync(jsPath, script);
    console.log('Successfully updated admin-script.js target ID');
} else {
    console.log('Old JS string not found in admin-script.js');
}
