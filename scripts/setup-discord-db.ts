import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const connection_string = process.env.DATABASE_URL;

if (!connection_string) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

const sql = neon(connection_string);

async function main() {
  console.log("Starting Discord integration migration...");

  try {
    // 1. Add Discord columns to hackathons table
    console.log("Adding Discord columns to hackathons table...");
    await sql`
      ALTER TABLE hackathons 
      ADD COLUMN IF NOT EXISTS discord_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS discord_server_type TEXT CHECK (discord_server_type IN ('INTERNAL', 'EXTERNAL')),
      ADD COLUMN IF NOT EXISTS discord_invite_link TEXT
    `;
    console.log("✓ Added discord columns to hackathons");

    // 2. Add Discord columns to hackathon_teams table
    console.log("Adding Discord columns to hackathon_teams table...");
    await sql`
      ALTER TABLE hackathon_teams 
      ADD COLUMN IF NOT EXISTS discord_channel_id TEXT
    `;
    console.log("✓ Added discord_channel_id to hackathon_teams");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

main();
