const { neon } = require('@neondatabase/serverless');
const DATABASE_URL = "postgresql://neondb_owner:npg_SI0y3AGsmrfl@ep-empty-tree-a1klnm0j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function checkGoated() {
    try {
        const teams = await sql`
            SELECT id, name, hackathon_id 
            FROM hackathon_teams
            WHERE LOWER(name) LIKE '%goated%'
        `;
        console.log("Teams matching 'goated':");
        console.table(teams);

        if (teams.length > 0) {
            const teamIds = teams.map(t => t.id);
            const submissions = await sql`
                SELECT id, team_id, hackathon_id, status FROM submissions
                WHERE team_id = ANY(${teamIds})
            `;
            console.log("\nSubmissions for these teams:");
            console.table(submissions);
        }

    } catch (e) {
        console.error(e);
    }
}

checkGoated();
