const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'admin.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Add download button to JV Register
const oldHeader = `<div style="padding:1.5rem; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1rem; color:#10b981;">Journal Register</h3>
                        <button class="btn btn-primary" onclick="openJvModal()" style="padding:6px 16px; font-size:0.75rem;">&#43; ADD JV</button>
                    </div>`;

const newHeader = `<div style="padding:1.5rem; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; font-size:1rem; color:#10b981;">Journal Register</h3>
                        <div style="display:flex; gap:10px;">
                            <button class="btn btn-ghost" onclick="downloadAllJvs()" style="padding:6px 16px; font-size:0.75rem; border:1px solid var(--glass-border); color: #fff;">⬇️ DOWNLOAD REGISTER</button>
                            <button class="btn btn-primary" onclick="openJvModal()" style="padding:6px 16px; font-size:0.75rem;">&#43; ADD JV</button>
                        </div>
                    </div>`;

if (html.includes(oldHeader)) {
    html = html.replace(oldHeader, newHeader);
} else {
    // try normalized
    const normalizedHtml = html.replace(/\r/g, '');
    const normalizedOld = oldHeader.replace(/\r/g, '');
    if (normalizedHtml.includes(normalizedOld)) {
        html = normalizedHtml.replace(normalizedOld, newHeader);
    } else {
        console.log('Could not find JV Register header to replace');
    }
}

// 2. Add jvViewModal before jvModal
const jvModalAnchor = `<div id="jvModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 4000;">`;

const jvViewModalHTML = `    <!-- JV View Modal -->
    <div id="jvViewModal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 5000;">
        <div class="glass-card" style="width: 800px; max-width: 95%; max-height: 90vh; display: flex; flex-direction: column; padding: 0;">
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                <h2 style="margin: 0; font-size: 1.2rem; color: #a855f7; display: flex; align-items: center; gap: 10px;">
                    📄 <span id="view-jv-no">JV-XXXX</span>
                </h2>
                <div style="display: flex; gap: 10px;">
                    <button type="button" class="btn btn-ghost" onclick="downloadSingleJv()" style="font-size: 0.75rem; border: 1px solid var(--glass-border);">⬇️ DOWNLOAD EXCLUSIVE RECORD</button>
                    <button type="button" class="btn btn-ghost" onclick="document.getElementById('jvViewModal').classList.add('hidden')" style="font-size: 1rem; padding: 4px 12px;">✕</button>
                </div>
            </div>
            
            <div style="padding: 1.5rem; flex: 1; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2rem; background: rgba(255,255,255,0.02); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--glass-border);">
                    <div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-bottom: 4px;">DATE</div>
                        <div id="view-jv-date" style="font-size: 1.1rem; color: #fff; font-weight: 600;">--</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-bottom: 4px;">TOTAL AMOUNT</div>
                        <div id="view-jv-total" style="font-size: 1.2rem; color: #10b981; font-weight: 800;">₹0.00</div>
                    </div>
                </div>

                <div style="margin-bottom: 2rem;">
                    <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-bottom: 8px;">NARRATION / NOTES</div>
                    <div id="view-jv-narration" style="font-size: 0.95rem; color: #ddd; line-height: 1.5; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--primary);">--</div>
                </div>

                <h3 style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700; margin-bottom: 1rem; border-bottom: 1px dashed var(--glass-border); padding-bottom: 8px;">POSTING DETAILS</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: rgba(255,255,255,0.03); color: var(--primary);">
                            <th style="padding: 10px; text-align: left;">ACCOUNT / ENTITY</th>
                            <th style="padding: 10px; text-align: left;">TYPE</th>
                            <th style="padding: 10px; text-align: left;">REMARKS</th>
                            <th style="padding: 10px; text-align: right; color: #ef4444; width: 120px;">DEBIT (DR)</th>
                            <th style="padding: 10px; text-align: right; color: #10b981; width: 120px;">CREDIT (CR)</th>
                        </tr>
                    </thead>
                    <tbody id="view-jv-lines">
                        <!-- Filled by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

`;

if (html.includes(jvModalAnchor) && !html.includes('id="jvViewModal"')) {
    html = html.replace(jvModalAnchor, jvViewModalHTML + jvModalAnchor);
    console.log('Injected jvViewModal HTML');
} else {
    console.log('jvViewModal already injected or anchor not found.');
}

fs.writeFileSync(htmlPath, html);

// 3. Update admin-script.js viewJv() function and add download functions
const jsPath = path.join(__dirname, '..', 'admin-script.js');
let script = fs.readFileSync(jsPath, 'utf8');

const targetRegex = /function viewJv\(id\) \{[\s\S]*?alert\(`JV NO: \$\{jv\.jvNo\}[^;]+`\);\n\}/;

const newJs = `let currentlyViewedJv = null;

function viewJv(id) {
    const jv = jvDataList.find(j => j.id === id);
    if (!jv) return;
    
    currentlyViewedJv = jv;
    
    document.getElementById('view-jv-no').innerText = jv.jvNo;
    document.getElementById('view-jv-date').innerText = new Date(jv.date).toLocaleDateString();
    document.getElementById('view-jv-total').innerText = \`₹\${Number(jv.totalAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}\`;
    document.getElementById('view-jv-narration').innerText = jv.narration || '-';
    
    const tbody = document.getElementById('view-jv-lines');
    tbody.innerHTML = '';
    
    jv.lines.forEach(l => {
        const isDr = l.type === 'DR';
        tbody.innerHTML += \`
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px 10px;">
                    <div style="color: #fff; font-weight: 600;">\${l.entityName}</div>
                    <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">[\${l.entityType}]</div>
                </td>
                <td style="padding: 12px 10px;">
                    <span style="font-weight: 900; background: \${isDr ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}; color: \${isDr ? '#ef4444' : '#10b981'}; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">\${l.type}</span>
                </td>
                <td style="padding: 12px 10px; color: var(--text-muted); font-size: 0.8rem;">\${l.notes || '-'}</td>
                <td style="padding: 12px 10px; text-align: right; color: \${isDr ? '#ef4444' : '#444'}; font-weight: \${isDr ? 'bold' : 'normal'};">
                    \${isDr ? \`₹\${Number(l.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}\` : '-'}
                </td>
                <td style="padding: 12px 10px; text-align: right; color: \${!isDr ? '#10b981' : '#444'}; font-weight: \${!isDr ? 'bold' : 'normal'};">
                    \${!isDr ? \`₹\${Number(l.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}\` : '-'}
                </td>
            </tr>
        \`;
    });
    
    document.getElementById('jvViewModal').classList.remove('hidden');
}

function downloadAllJvs() {
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
}

function downloadSingleJv() {
    if (!currentlyViewedJv) return;
    const jv = currentlyViewedJv;
    
    let csv = "JV NO,DATE,NARRATION,TOTAL AMOUNT\\n";
    csv += \`"\${jv.jvNo}","\${new Date(jv.date).toLocaleDateString()}","\${(jv.narration||'').replace(/"/g, '""')}","\${jv.totalAmount}"\\n\\n\`;
    
    csv += "POSTING DETAILS\\n";
    csv += "ACCOUNT/ENTITY,TYPE,REMARKS,DEBIT (DR),CREDIT (CR)\\n";
    
    jv.lines.forEach(l => {
        const isDr = l.type === 'DR';
        csv += \`"\${(l.entityName||'').replace(/"/g, '""')} [\${l.entityType}]","\${l.type}","\${(l.notes||'').replace(/"/g, '""')}","\${isDr ? l.amount : ''}","\${!isDr ? l.amount : ''}"\\n\`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`Journal_Voucher_\${jv.jvNo}.csv\`;
    a.click();
}`;

if (targetRegex.test(script)) {
    script = script.replace(targetRegex, newJs);
    console.log('Replaced viewJv function and added download logic');
    fs.writeFileSync(jsPath, script);
} else {
    // If the function was already replaced, we shouldn't do it again.
    console.log('viewJv regex target not found. Perhaps it was already updated.');
}
