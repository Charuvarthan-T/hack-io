import "dotenv/config";
import sql from "../lib/db";

async function main() {
    console.log("Starting database migration...");

    try {
        await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
        team_id UUID NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
        repo_url TEXT NOT NULL,
        ppt_object_key TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED')) DEFAULT 'SUBMITTED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
        console.log("✅ Created 'submissions' table.");

        // Create index for faster lookups by hackathon and team
        await sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_hackathon_team ON submissions(hackathon_id, team_id);
    `;
        console.log("✅ Created index 'idx_submissions_hackathon_team'.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }

    console.log("Migration completed successfully.");
    process.exit(0);
}

main();
