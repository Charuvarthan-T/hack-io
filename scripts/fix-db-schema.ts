import "dotenv/config";
import sql from "../lib/db";

async function main() {
    console.log("Fixing problems_users schema...");

    try {
        // Add updated_at to problems_users
        await sql`
            ALTER TABLE problems_users 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        `;
        console.log("✅ Added 'updated_at' to 'problems_users'.");

    } catch (error) {
        console.error("❌ Fix failed:", error);
        process.exit(1);
    }

    console.log("Fix completed successfully.");
    process.exit(0);
}

main();
