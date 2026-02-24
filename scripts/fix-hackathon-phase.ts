import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const connection_string = process.env.DATABASE_URL;
if (!connection_string) {
    throw new Error("DATABASE_URL is not defined");
}
const sql = neon(connection_string);
async function main() {
    console.log("Fixing hackathon phases...");
    try {
        await sql`
            ALTER TABLE hackathons
            ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'SUBMISSION';
        `;
        console.log("✅ Column 'phase' ensured.");
        const result = await sql`
            UPDATE hackathons
            SET phase = 'EVALUATION'
            RETURNING id, name, phase;
        `;
        console.log("✅ Updated hackathons:", result);
    } catch (error) {
        console.error("❌ Fix failed:", error);
        process.exit(1);
    }
    console.log("Fix completed successfully.");
    process.exit(0);
}
main();
