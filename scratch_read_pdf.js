const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('C:\\Users\\J S DASH\\Desktop\\HD TEST INVOICE.pdf');

pdf(dataBuffer).then(function(data) {
    console.log("--- PDF RAW TEXT ---");
    console.log(data.text);
    console.log("--------------------");
}).catch(err => {
    console.error("Parse Error:", err);
});
