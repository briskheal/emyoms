const fs = require('fs');
const path = require('path');

const filesToClean = [
    'admin.html', 
    'admin-script.js', 
    'index.html', 
    'script.js', 
    'pdcn-portal.html', 
    'server.js'
];

// Comprehensive mapping of mojibake to correct characters
const replacements = [
    { regex: /ðŸŽ¨/g, rep: '🎨' },
    { regex: /â„¹ï¸/g, rep: 'ℹ️' },
    { regex: /ðŸŒ/g, rep: '🌐' },
    { regex: /â–¼/g, rep: '▼' },
    { regex: /ðŸ›’/g, rep: '🛒' },
    { regex: /ðŸ“Š/g, rep: '📊' },
    { regex: /ðŸ› ï¸/g, rep: '🛠️' },
    { regex: /âš™ï¸/g, rep: '⚙️' },
    { regex: /ðŸ¤/g, rep: '🤝' },
    { regex: /ðŸ“¦/g, rep: '📦' },
    { regex: /ðŸ’Š/g, rep: '💊' },
    { regex: /ðŸ”/g, rep: '🔍' },
    { regex: /ðŸ“¥/g, rep: '📥' },
    { regex: /ðŸ“¤/g, rep: '📤' },
    { regex: /ðŸ—‘ï¸/g, rep: '🗑️' },
    { regex: /â ³/g, rep: '⏳' },
    { regex: /âœ…/g, rep: '✅' },
    { regex: /â Œ/g, rep: '❌' },
    { regex: /ðŸ’¾/g, rep: '💾' },
    { regex: /ðŸ ·ï¸/g, rep: '🏷️' },
    { regex: /ðŸ ¢/g, rep: '🏢' },
    { regex: /ðŸ“œ/g, rep: '📜' },
    { regex: /ðŸ“/g, rep: '📝' },
    { regex: /ðŸ”„/g, rep: '🔄' },
    { regex: /ðŸ§¾/g, rep: '🧾' },
    { regex: /ðŸ“‘/g, rep: '📋' },
    { regex: /ðŸ’°/g, rep: '💰' },
    { regex: /âœï¸/g, rep: '📝' },
    { regex: /ðŸ‘ï¸/g, rep: '👁️' },
    { regex: /ðŸš€/g, rep: '🚀' },
    { regex: /âœ–/g, rep: '✖' },
    { regex: /âœ”/g, rep: '✔' },
    { regex: /â–¶/g, rep: '▶' },
    { regex: /â— /g, rep: '●' },
    { regex: /â‚¹/g, rep: '₹' },
    { regex: /ï¼‹/g, rep: '+' },
    { regex: /âœ•/g, rep: '✕' },
    { regex: /âœ“/g, rep: '✓' },
    { regex: /ðŸ’¸/g, rep: '💸' },
    { regex: /ðŸ“‹/g, rep: '📋' },
    { regex: /ðŸ—/g, rep: '🗑️' },
    { regex: /ðŸ“📄/g, rep: '📄' },
    { regex: /Â±/g, rep: '±' },
    { regex: /â”€/g, rep: '─' },
    { regex: /ï¼ /g, rep: '!' },
    { regex: /\uFFFD/g, rep: '' },
    { regex: /ðŸ’³/g, rep: '💳' },
    { regex: /ðŸ“ž/g, rep: '📞' },
    { regex: /ðŸ“§/g, rep: '📧' },
    { regex: /ðŸ“Œ/g, rep: '📍' },
];

filesToClean.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;
        
        replacements.forEach(r => {
            content = content.replace(r.regex, r.rep);
        });
        
        // Manual fix for common specific ones found in scans
        content = content.replace(/ï¼‹ ADD ITEM/g, '+ ADD ITEM');
        content = content.replace(/âœ• CANCEL/g, '✕ CANCEL');
        content = content.replace(/âœ• Close/g, '✕ Close');
        content = content.replace(/â‚¹0\.00/g, '₹0.00');
        content = content.replace(/📝„/g, '📝');
        content = content.replace(/📝…/g, '📝');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Cleaned: ${file}`);
        } else {
            console.log(`ℹ️ No garbled characters found in: ${file}`);
        }
    }
});
