
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config(); // Fallback to .env

const connection_string = process.env.DATABASE_URL;

if (!connection_string) {
    throw new Error("DATABASE_URL environment variable is not defined");
}

const sql = neon(connection_string);

async function main() {
    console.log("Starting migration...");
    try {
        await sql`
      CREATE TABLE IF NOT EXISTS hackathon_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL,
        title TEXT NOT NULL,w
        description TEXT,
        assigned_by TEXT NOT NULL,
        assigned_to TEXT,
        status TEXT NOT NULL DEFAULT 'TODO',
        due_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
        console.log("Migration completed: hackathon_tasks table created.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
