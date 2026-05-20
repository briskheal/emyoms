require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
    try {
        const apiKey = "AIzaSyDGNr3CH8ZcdgtAzWmXln4xnQw_i5-U388"; // User's key
        console.log("Testing with key:", apiKey.substring(0, 10) + "...");
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = "Reply with 'Hello, Gemini works!'";
        const result = await model.generateContent(prompt);
        console.log("Success:", result.response.text());
        
    } catch (e) {
        console.error("Gemini Error:", e.message);
    }
}
run();
