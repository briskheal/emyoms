require('dotenv').config();
const https = require('https');

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const models = JSON.parse(data).models;
        if (models) {
            console.log(models.map(m => m.name).join('\n'));
        } else {
            console.log(data);
        }
    });
});
