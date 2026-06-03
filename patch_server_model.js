const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

serverCode = serverCode.replace(
    /model: "gemini-2\.5-flash",/g,
    `model: "gemini-flash-latest",`
);

fs.writeFileSync('server.js', serverCode);
console.log('Fixed server.js Gemini model to gemini-flash-latest');
