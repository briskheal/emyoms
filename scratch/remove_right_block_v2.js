const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(filePath, 'utf8');

const startStr = '<!-- Bill-wise Allocation Sidebar -->';
const endStr = 'AUTO-ALLOCATE (FIFO)</button>\n                    </div>\n                </div>';

const startIdx = html.indexOf(startStr);
if (startIdx !== -1) {
    const endIdx = html.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        html = html.substring(0, startIdx) + html.substring(endIdx + endStr.length);
        fs.writeFileSync(filePath, html);
        console.log('Successfully removed the right block!');
    } else {
        console.log('endStr not found');
    }
} else {
    console.log('startStr not found');
}
