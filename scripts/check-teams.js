const { neon } = require('@neondatabase/serverless');
const DATABASE_URL = "postgresql://neondb_owner:npg_SI0y3AGsmrfl@ep-empty-tree-a1klnm0j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function checkTeams() {
    try {
        const allTeams = await sql`
            SELECT id, name, '"' || name || '"' as quoted_name, hackathon_id 
            FROM hackathon_teams
        `;
        console.log("All Teams with Quoted Names:");
        console.table(allTeams);

        const duplicates = await sql`
            SELECT LOWER(TRIM(name)) as processed_name, COUNT(*) as count, ARRAY_AGG(id) as ids
            FROM hackathon_teams
            GROUP BY LOWER(TRIM(name))
            HAVING COUNT(*) > 1
        `;
        console.log("\nPotential Duplicate Names (Case-insensitive & Trimmed):");
        console.table(duplicates);

    } catch (e) {
        console.error(e);
    }
}

checkTeams();
