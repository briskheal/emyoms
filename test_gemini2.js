require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log("Success with", modelName);
    } catch (e) {
        console.error("Error with", modelName, ":", e.message);
    }
}

async function run() {
    await test("gemini-1.5-flash-latest");
    await test("gemini-1.5-pro");
    await test("gemini-1.0-pro");
    await test("gemini-2.0-flash-exp");
}
run();
