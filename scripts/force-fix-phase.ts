import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    try {
        console.log("Force Resetting Phase Column...");

        // Drop first to be absolutely sure
        try {
            await sql`ALTER TABLE hackathons DROP COLUMN IF EXISTS phase`;
            console.log("Dropped phase column.");
        } catch(e) {
            console.log("None to drop or drop failed (ignoring).");
        }

        // Add fresh
        await sql`ALTER TABLE hackathons ADD COLUMN phase TEXT DEFAULT 'EVALUATION'`;
        console.log("✅ Column phase added fresh with EVALUATION default.");

        // Double check
        const data = await sql`SELECT id, name, phase FROM hackathons`;
        console.log("Final State:");
        console.table(data);

    } catch (error) {
        console.error("Critical Failure:", error);
    }
}

main();
