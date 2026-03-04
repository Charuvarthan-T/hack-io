const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    try {
        const genAI = new GoogleGenerativeAI("AIzaSyBkCy4qf-8LkGvJaqBMluxxsOjUfHR0MEs");
        // Test with gemini-pro instead of gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say 'hello world'");
        console.log("Success:", result.response.text());
    } catch(e) {
        console.error("Error:", e.message);
    }
}
test();
