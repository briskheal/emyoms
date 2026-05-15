const fs = require('fs');
const content = fs.readFileSync('d:/MY WORK FLOW/EMYOMS/scratch/old_admin.html', 'utf8');
const start = content.indexOf('id="tab-reports"');
if (start !== -1) {
    const divStart = content.lastIndexOf('<div', start);
    const end = content.indexOf('<!-- SYSTEM HEALTH TAB -->', start);
    if (end !== -1) {
        fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/scratch/reports_content.html', content.substring(divStart, end), 'utf8');
        console.log("SUCCESS: Content saved to reports_content.html");
    } else {
        console.log("Could not find end marker");
    }
} else {
    console.log("Could not find id='tab-reports'");
}
