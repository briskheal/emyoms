const fs = require('fs');
const content = fs.readFileSync('d:/MY WORK FLOW/EMYOMS/scratch/old_admin.html', 'utf8');
const searchStr = '<div id="tab-reports"';
const start = content.indexOf(searchStr);
if (start !== -1) {
    const end = content.indexOf('<div id="tab-settings"', start);
    if (end !== -1) {
        fs.writeFileSync('d:/MY WORK FLOW/EMYOMS/scratch/reports_restore.html', content.substring(start, end), 'utf8');
        console.log("SUCCESS");
    } else {
        console.log("Could not find tab-settings end marker");
    }
} else {
    console.log("Could not find " + searchStr);
}
