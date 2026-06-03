require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (e) {
        console.error("Error with gemini-2.5-flash:", e.message);
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result2 = await model2.generateContent("Hello");
            console.log("Success with gemini-1.5-flash:", result2.response.text());
        } catch (e2) {
            console.error("Error with gemini-1.5-flash:", e2.message);
        }
    }
}
test();
