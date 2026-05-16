const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'admin.html');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the line index of '<!-- Bill-wise Allocation Sidebar -->'
const startIdx = lines.findIndex(l => l.includes('<!-- Bill-wise Allocation Sidebar -->'));
if (startIdx !== -1) {
    let endIdx = -1;
    for (let i = startIdx + 1; i < lines.length; i++) {
        if (lines[i].includes('AUTO-ALLOCATE (FIFO)</button>')) {
            // we found the button line
            // the div closing it is two lines down
            endIdx = i + 2;
            break;
        }
    }
    
    if (endIdx !== -1) {
        lines.splice(startIdx, endIdx - startIdx + 1);
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log('Right sidebar successfully removed line-by-line.');
    } else {
        console.log('End bound not found.');
    }
} else {
    console.log('Start bound not found.');
}
