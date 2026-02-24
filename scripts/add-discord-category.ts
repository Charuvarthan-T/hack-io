import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
config({ path: ".env.local" });
const connection_string = process.env.DATABASE_URL;
if (!connection_string) {
  throw new Error("DATABASE_URL environment variable is not defined");
}
const sql = neon(connection_string);
async function main() {
  console.log("Starting Discord category migration...");
  try {
    console.log("Adding discord_category_id to hackathons table...");
    await sql`
      ALTER TABLE hackathons
      ADD COLUMN IF NOT EXISTS discord_category_id TEXT
    `;
    console.log("✓ Added discord_category_id to hackathons");
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  }
}
main();
