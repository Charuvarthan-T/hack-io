import sql from "../lib/db";
async function main() {
  console.log("Setting up task database...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS hackathon_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES hackathon_teams(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        assigned_by UUID NOT NULL REFERENCES users(id),
        assigned_to UUID REFERENCES users(id),
        status TEXT NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')) DEFAULT 'TODO',
        due_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("Created hackathon_tasks table.");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_hackathon_tasks_team_id ON hackathon_tasks(team_id);
    `;
    console.log("Created indices.");
  } catch (error) {
    console.error("Error setting up tasks db:", error);
  } finally {
    console.log("Done.");
    process.exit(0);
  }
}
main();
