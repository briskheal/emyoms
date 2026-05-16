const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Update header with date inputs
const oldHeader = `<div style="padding:1.5rem; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1rem; color:#10b981;">Journal Register</h3>
                        <div style="display:flex; gap:10px;">
                            <button class="btn btn-ghost" onclick="downloadAllJvs()" style="padding:6px 16px; font-size:0.75rem; border:1px solid var(--glass-border); color: #fff;">⬇️ DOWNLOAD REGISTER</button>
                            <button class="btn btn-primary" onclick="openJvModal()" style="padding:6px 16px; font-size:0.75rem;">&#43; ADD JV</button>
                        </div>
                    </div>`;

const newHeader = `<div style="padding:1.5rem; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1rem; color:#10b981;">Journal Register</h3>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="display:flex; align-items:center; gap:5px;">
                                <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">FROM:</label>
                                <input type="date" id="jv-from-date" style="background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; font-size:0.7rem; padding:4px 8px; border-radius:6px;">
                            </div>
                            <div style="display:flex; align-items:center; gap:5px;">
                                <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">TO:</label>
                                <input type="date" id="jv-to-date" style="background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); color:#fff; font-size:0.7rem; padding:4px 8px; border-radius:6px;">
                            </div>
                            <button class="btn btn-ghost" onclick="downloadAllJvs()" style="padding:6px 16px; font-size:0.75rem; border:1px solid var(--glass-border); color: #fff;">⬇️ DOWNLOAD REGISTER</button>
                            <button class="btn btn-primary" onclick="openJvModal()" style="padding:6px 16px; font-size:0.75rem;">&#43; ADD JV</button>
                        </div>
                    </div>`;

if (html.includes(oldHeader)) {
    html = html.replace(oldHeader, newHeader);
} else {
    const normalizedHtml = html.replace(/\r/g, '');
    const normalizedOld = oldHeader.replace(/\r/g, '');
    if (normalizedHtml.includes(normalizedOld)) {
        html = normalizedHtml.replace(normalizedOld, newHeader);
    } else {
        console.log('Header not found in admin.html');
    }
}

fs.writeFileSync(htmlPath, html);

// Update admin-script.js
const jsPath = path.join(__dirname, '..', 'admin-script.js');
let script = fs.readFileSync(jsPath, 'utf8');

const oldDownloadAll = `function downloadAllJvs() {
    if (!jvDataList || jvDataList.length === 0) return alert("No Journal Entries to download.");
    
    let csv = "JV NO,DATE,NARRATION,TOTAL AMOUNT,LINE TYPE,ACCOUNT TYPE,ACCOUNT NAME,LINE AMOUNT,LINE NOTES\\n";
    
    jvDataList.forEach(jv => {
        jv.lines.forEach((l, idx) => {
            csv += \`"\${idx===0?jv.jvNo:''}","\${idx===0?new Date(jv.date).toLocaleDateString():''}","\${idx===0?(jv.narration||'').replace(/"/g, '""'):''}","\${idx===0?jv.totalAmount:''}","\${l.type}","\${l.entityType}","\${(l.entityName||'').replace(/"/g, '""')}","\${l.amount}","\${(l.notes||'').replace(/"/g, '""')}"\\n\`;
        });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`Journal_Register_\${new Date().toISOString().split('T')[0]}.csv\`;
    a.click();
}`;

const newDownloadAll = `function downloadAllJvs() {
    if (!jvDataList || jvDataList.length === 0) return alert("No Journal Entries to download.");
    
    const fromDate = document.getElementById('jv-from-date').value;
    const toDate = document.getElementById('jv-to-date').value;
    
    let filtered = jvDataList;
    if (fromDate) filtered = filtered.filter(j => new Date(j.date) >= new Date(fromDate));
    if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(j => new Date(j.date) <= end);
    }
    
    if (filtered.length === 0) return alert("No Journal Entries found for the selected date range.");

    let csv = "DATE,JV NO,ACCOUNT/ENTITY,TYPE,REMARKS,DEBIT (DR),CREDIT (CR),NARRATION\\n";
    
    filtered.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(jv => {
        jv.lines.forEach((l, idx) => {
            const isDr = l.type === 'DR';
            csv += \`"\${idx===0?new Date(jv.date).toLocaleDateString():''}","\${idx===0?jv.jvNo:''}","\${(l.entityName||'').replace(/"/g, '""')} [\${l.entityType}]","\${l.type}","\${(l.notes||'').replace(/"/g, '""')}","\${isDr ? l.amount : ''}","\${!isDr ? l.amount : ''}","\${idx===0?(jv.narration||'').replace(/"/g, '""'):''}"\\n\`;
        });
        csv += "\\n"; // Empty line between JVs for readability
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`Journal_Register_\${fromDate || 'start'}_to_\${toDate || 'end'}.csv\`;
    a.click();
}`;

if (script.includes(oldDownloadAll)) {
    script = script.replace(oldDownloadAll, newDownloadAll);
} else {
    console.log('downloadAllJvs not found in admin-script.js');
}

fs.writeFileSync(jsPath, script);
