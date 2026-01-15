import "dotenv/config";
import { storage } from "../lib/storage";

async function main() {
    console.log("🧪 Starting Storage Verification...");

    const testKey = "verification/test-" + Date.now() + ".txt";
    const content = "Verification of Supabase Storage Integration";

    try {
        console.log(`uploading to ${testKey}...`);
        const path = await storage.uploadFile(testKey, content, "text/plain");
        console.log(`✅ Upload successful! Path: ${path}`);

        console.log("Generating signed URL...");
        const url = await storage.getSignedUrl(path);
        console.log(`✅ Signed URL generated: ${url}`);

        console.log("🎉 Storage integration is working correctly!");
    } catch (error) {
        console.error("❌ Storage verification failed:", error);
        process.exit(1);
    }
}

main();
