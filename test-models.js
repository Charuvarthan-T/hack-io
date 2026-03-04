const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    try {
        const genAI = new GoogleGenerativeAI("AIzaSyBkCy4qf-8LkGvJaqBMluxxsOjUfHR0MEs");

        // Let's try to just list the models the key has access to
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBkCy4qf-8LkGvJaqBMluxxsOjUfHR0MEs`);
        const data = await response.json();

        if (data.models) {
            console.log("Available models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log("Response:", data);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
