const fs = require('fs');
let content = fs.readFileSync('script.js', 'utf8');

// The string in the file is: .replace(/'/g, \"\\'\")
// We want to replace it with: .replace(/'/g, "\\'")

content = content.replace(/\\"\\\\\\'"\\"/g, '"\\\\\'"'); // Just in case it's heavily escaped
content = content.replace(/\\\"\\\\\\'\\\"/g, '"\\\\\'"');

// Actually let's just do a simple replace since it's exactly: \”\\'\” but backslashes.
content = content.replace(/.replace\(\/\'\/g, \\"\\\\'\\"\)/g, ".replace(/'/g, `\\\\\\'`)");

// Even safer: replace the entire line
content = content.replace(/onclick="selectReturnProduct\(\$\{idx\}, '\$\{\(m\.name \|\| ''\)\.replace\(\/'\/g, \\"\\\\\\\'\\"\)\}',/g,
    `onclick="selectReturnProduct(\${idx}, '\${(m.name || '').replace(/'/g, "\\\\'")}',`);

content = content.replace(/onclick="selectReturnProduct\(\$\{idx\}, '\$\{\(m\.name \|\| ''\)\.replace\(\/'\/g, \\"\\\\'\\"\)\}',/g,
    `onclick="selectReturnProduct(\${idx}, '\${(m.name || '').replace(/'/g, "\\\\'")}',`);

content = content.replace(/\\\"\\\\\'\\\"/g, `"\\\\'"`);

fs.writeFileSync('script.js', content);
console.log("Fixed syntax error");
