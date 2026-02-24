import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    try {
        console.log("Starting DB Repair...");

        // 1. Check columns in hackathons
        const hackCols = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'hackathons';
        `;
        const hasPhase = hackCols.some(c => c.column_name === 'phase');
        console.log("Has phase column:", hasPhase);

        if (!hasPhase) {
            console.log("Adding phase column...");
            await sql`ALTER TABLE hackathons ADD COLUMN phase TEXT DEFAULT 'EVALUATION'`;
            console.log("✅ Column added.");
        } else {
            console.log("Updating all hackathons to EVALUATION phase...");
            await sql`UPDATE hackathons SET phase = 'EVALUATION'`;
            console.log("✅ Phases updated.");
        }

        const finalCheck = await sql`SELECT id, name, phase FROM hackathons`;
        console.log("Final State:");
        console.table(finalCheck);

    } catch (error) {
        console.error("Repair failed:", error);
    }
}

main();
