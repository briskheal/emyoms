const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pdf = require('pdf-parse');
require('dotenv').config();

async function testGemini() {
    const pdfPath = "D:\\MY WORK FLOW\\EMYOMS\\EMYRIS-OMS-invoice_sample.jpg.PDF";
    console.log("Reading PDF file:", pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
        console.error("PDF file not found!");
        return;
    }
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;
    console.log("Successfully extracted raw PDF text. Total characters:", text.length);
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY is not defined in .env file.");
        return;
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const prompt = `Analyze the following invoice text extracted from a PDF. Extract the invoice metadata and all product line items.
For expDate, convert it strictly to MM/YYYY format if possible (e.g. 05/2027), otherwise keep it as found.
If HSN, batch, or other values are missing, provide best effort or leave blank.

Here is the invoice text:
---
${text}
---`;

    const payload = {
        contents: [
            {
                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    invoiceNo: { type: "STRING" },
                    date: { type: "STRING", description: "Invoice date in YYYY-MM-DD format" },
                    customerName: { type: "STRING" },
                    placeOfSupply: { type: "STRING" },
                    pincode: { type: "STRING" },
                    fssaiNo: { type: "STRING" },
                    email: { type: "STRING" },
                    items: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING", description: "Product name" },
                                hsn: { type: "STRING", description: "HSN Code (4, 6 or 8 digits)" },
                                batch: { type: "STRING", description: "Batch number" },
                                expDate: { type: "STRING", description: "Expiry date in MM/YY or MM/YYYY format" },
                                mrp: { type: "NUMBER", description: "Maximum Retail Price" },
                                qty: { type: "INTEGER", description: "Quantity" },
                                rate: { type: "NUMBER", description: "Purchase Rate / PTR" },
                                gst: { type: "NUMBER", description: "GST percentage (e.g. 5, 12, 18)" }
                            },
                            required: ["name", "qty"]
                        }
                    }
                },
                required: ["items"]
            }
        }
    };

    console.log("Sending request to Gemini API...");
    try {
        const response = await axios.post(url, payload, { timeout: 20000 });
        const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
            console.error("No content in response:", JSON.stringify(response.data));
            return;
        }
        console.log("--- GEMINI PARSED RESPONSE ---");
        const parsed = JSON.parse(content);
        console.log(JSON.stringify(parsed, null, 2));
        console.log("------------------------------");
        console.log(`Success! Parsed ${parsed.items?.length || 0} items.`);
    } catch (err) {
        console.error("Gemini request failed:", err.message);
        if (err.response) {
            console.error("Response status:", err.response.status);
            console.error("Response data:", JSON.stringify(err.response.data));
        }
    }
}

testGemini();
