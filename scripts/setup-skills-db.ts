import "dotenv/config";
import sql from "../lib/db";

async function main() {
    console.log("Starting skills and external hackathons migration...");

    try {
        // 1. Add skill columns to users table
        console.log("Updating 'users' table...");
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS manual_skills JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS last_skill_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        `;
        console.log("✅ Updated 'users' table.");

        // 2. Add difficulty to problems table
        console.log("Updating 'problems' table...");
        await sql`
            ALTER TABLE problems 
            ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1; -- 1: EASY, 2: MEDIUM, 3: HARD
        `;
        console.log("✅ Updated 'problems' table.");

        // 3. Create external_hackathons table
        console.log("Creating 'external_hackathons' table...");
        await sql`
            CREATE TABLE IF NOT EXISTS external_hackathons (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                description TEXT,
                deadline TIMESTAMP WITH TIME ZONE,
                mode TEXT CHECK (mode IN ('online', 'offline')),
                external_url TEXT NOT NULL UNIQUE,
                skills JSONB DEFAULT '[]'::jsonb, -- Array of strings or objects with weights
                source TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        console.log("✅ Created 'external_hackathons' table.");

        // 4. Create index for external_hackathons skills search if needed
        // Since we are using JSONB, we can use a GIN index later if performance requires it.

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }

    console.log("Migration completed successfully.");
    process.exit(0);
}

main();
