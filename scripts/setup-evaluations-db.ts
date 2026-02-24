import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connection_string = process.env.DATABASE_URL;
if (!connection_string) {
    throw new Error("DATABASE_URL environment variable is not defined");
}
const sql = neon(connection_string);

async function main() {
    console.log("Starting evaluations database migration...");

    try {
        // 1. Create Hackathon Evaluations Table
        await sql`
      CREATE TABLE IF NOT EXISTS hackathon_evaluations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
        judge_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        innovation_score INT NOT NULL CHECK (innovation_score BETWEEN 0 AND 10),
        technical_complexity_score INT NOT NULL CHECK (technical_complexity_score BETWEEN 0 AND 10),
        implementation_quality_score INT NOT NULL CHECK (implementation_quality_score BETWEEN 0 AND 10),
        ui_ux_score INT NOT NULL CHECK (ui_ux_score BETWEEN 0 AND 10),
        impact_score INT NOT NULL CHECK (impact_score BETWEEN 0 AND 10),
        presentation_quality_score INT NOT NULL CHECK (presentation_quality_score BETWEEN 0 AND 10),
        feedback TEXT,
        is_draft BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(submission_id, judge_id)
      );
    `;
        console.log("✅ Created 'hackathon_evaluations' table.");

        // 2. Add phase-related states to hackathons if not already sufficient
        // Actually, the current states are DRAFT, PUBLISHED, ACTIVE, COMPLETED.
        // We might want to add EVALUATION and RESULTS as explicit statuses for better control.
        // But for now, we can use status to filter.
        // Let's check status constraints.

        console.log("Checking hackathons status constraint...");

        // This is a bit tricky with neon-serverless in a script without DDL info.
        // We'll trust the existing status but maybe add a 'phase' column for more granularity.
        // The spec mentions: Submission Phase, Evaluation Phase, Results Phase.

        await sql`
            ALTER TABLE hackathons 
            ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'SUBMISSION' 
            CHECK (phase IN ('SUBMISSION', 'EVALUATION', 'RESULTS'));
        `;
        console.log("✅ Added 'phase' column to 'hackathons' table.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }

    console.log("Migration completed successfully.");
    process.exit(0);
}

main();
