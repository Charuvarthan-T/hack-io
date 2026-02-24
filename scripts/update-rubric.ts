import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connection_string = process.env.DATABASE_URL;
if (!connection_string) {
    throw new Error("DATABASE_URL environment variable is not defined");
}
const sql = neon(connection_string);

async function main() {
    console.log("Updating rubric columns...");

    try {
        await sql`
            ALTER TABLE hackathon_evaluations 
            ADD COLUMN IF NOT EXISTS ui_score INT NOT NULL DEFAULT 0 CHECK (ui_score BETWEEN 0 AND 10),
            ADD COLUMN IF NOT EXISTS backend_score INT NOT NULL DEFAULT 0 CHECK (backend_score BETWEEN 0 AND 10),
            ADD COLUMN IF NOT EXISTS graphs_score INT NOT NULL DEFAULT 0 CHECK (graphs_score BETWEEN 0 AND 10),
            ADD COLUMN IF NOT EXISTS discord_interaction_score INT NOT NULL DEFAULT 0 CHECK (discord_interaction_score BETWEEN 0 AND 10);
        `;
        console.log("✅ Added new rubric columns to 'hackathon_evaluations' table.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }

    console.log("Migration completed successfully.");
    process.exit(0);
}

main();
