const { neon } = require('@neondatabase/serverless');
const DATABASE_URL = "postgresql://neondb_owner:npg_SI0y3AGsmrfl@ep-empty-tree-a1klnm0j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);
async function listAllTeams() {
    try {
        const hacks = await sql`SELECT id FROM hackathons ORDER BY created_at DESC LIMIT 1`;
        const hackathonId = hacks[0].id;
        console.log(`Hackathon ID: ${hackathonId}`);
        const teams = await sql`
            SELECT id, name FROM hackathon_teams
            WHERE hackathon_id = ${hackathonId}
            ORDER BY name
        `;
        console.log("Teams:");
        teams.forEach(t => console.log(`${t.id} | ${t.name}`));
    } catch (e) {
        console.error(e);
    }
}
listAllTeams();
