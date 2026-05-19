const fs = require('fs');
const pdf = require('pdf-parse');

const PDF_PATH = `C:\\Users\\J S DASH\\Desktop\\aadi\\CRITICARE_HEALTHCARE_Invoice_AP_SL_26_27_56.pdf`;

async function run() {
    console.log("📂 Running pdf-parse on Criticare Healthcare Invoice...");
    if (!fs.existsSync(PDF_PATH)) {
        console.error("❌ File not found!");
        return;
    }
    const dataBuffer = fs.readFileSync(PDF_PATH);
    try {
        const data = await pdf(dataBuffer);
        console.log(`✅ Text extracted successfully! Total character length: ${data.text.length}`);
        console.log("\n📑 Extracted Text Content (First 1000 characters):");
        console.log(data.text.substring(0, 1000));
        
        console.log("\n📑 Full Extracted Text Content:");
        console.log(data.text);
    } catch (e) {
        console.error("❌ Error parsing PDF:", e);
    }
}

run();
