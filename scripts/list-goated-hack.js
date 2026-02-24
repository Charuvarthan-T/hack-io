const { neon } = require('@neondatabase/serverless');
const DATABASE_URL = "postgresql://neondb_owner:npg_SI0y3AGsmrfl@ep-empty-tree-a1klnm0j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);
async function listGoated() {
    try {
        const hacks = await sql`SELECT id FROM hackathons ORDER BY created_at DESC LIMIT 5`;
        for (const h of hacks) {
            const teams = await sql`
                SELECT id, name, hackathon_id FROM hackathon_teams
                WHERE LOWER(name) LIKE '%goated%' AND hackathon_id = ${h.id}
            `;
            if (teams.length > 0) {
                console.log(`\nHackathon: ${h.id}`);
                console.table(teams);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
listGoated();
