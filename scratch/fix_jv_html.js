const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin.html');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('<thead>') && lines[lines.indexOf(l)-1].includes('<table class="modern-table">') && lines[lines.indexOf(l)+2].includes('<th style="width: 100px;">JV NO</th>'));

if (startIdx !== -1) {
    let endIdx = startIdx;
    while (!lines[endIdx].includes('</tbody>')) {
        endIdx++;
    }

    const newContent = `                            <thead>
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
                            </tbody>`.split('\n');

    lines.splice(startIdx, endIdx - startIdx + 1, ...newContent);
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log('Successfully updated HTML headers');
} else {
    console.log('Could not find HTML headers block');
}
