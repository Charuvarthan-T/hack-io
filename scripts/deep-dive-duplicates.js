const { neon } = require('@neondatabase/serverless');
const DATABASE_URL = "postgresql://neondb_owner:npg_SI0y3AGsmrfl@ep-empty-tree-a1klnm0j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function deepDive() {
    try {
        const hacks = await sql`SELECT id, title FROM hackathons ORDER BY created_at DESC LIMIT 5`;
        console.log("Recent Hackathons:");
        console.table(hacks);

        for (const h of hacks) {
            console.log(`\n--- Hackathon: ${h.title} (${h.id}) ---`);
            
            // Check for teams with multiple IDs or names that look the same
            const teams = await sql`
                SELECT id, name, ENCODE(name::bytea, 'hex') as hex_name
                FROM hackathon_teams
                WHERE hackathon_id = ${h.id}
            `;
            console.log("Teams:");
            console.table(teams);

            const submissions = await sql`
                SELECT id, team_id, status, submitted_at
                FROM submissions
                WHERE hackathon_id = ${h.id}
            `;
            console.log("Submissions:");
            console.table(submissions);

            // Run the actual leaderboard query logic
            const leaderboard = await sql`
                WITH judge_totals AS (
                    SELECT 
                        submission_id,
                        judge_id,
                        (innovation_score + technical_complexity_score + implementation_quality_score + ui_ux_score + impact_score + presentation_quality_score + ui_score + backend_score + graphs_score + discord_interaction_score) as total_rubric_score
                    FROM hackathon_evaluations
                    WHERE is_draft = FALSE
                ),
                submission_scores AS (
                    SELECT 
                        s.id as submission_id,
                        s.team_id,
                        s.submitted_at,
                        AVG(jt.total_rubric_score) as final_average_score,
                        COUNT(jt.judge_id) as judge_count
                    FROM submissions s
                    LEFT JOIN judge_totals jt ON s.id = jt.submission_id
                    WHERE s.hackathon_id = ${h.id} AND s.status = 'SUBMITTED'
                    GROUP BY s.id
                ),
                team_best_entries AS (
                    SELECT DISTINCT ON (LOWER(TRIM(t.name)))
                        ss.submission_id,
                        t.name as team_name,
                        t.id as team_id,
                        ss.final_average_score,
                        ss.judge_count
                    FROM hackathon_teams t
                    JOIN submission_scores ss ON t.id = ss.team_id
                    WHERE t.hackathon_id = ${h.id}
                    ORDER BY LOWER(TRIM(t.name)), ss.final_average_score DESC NULLS LAST
                )
                SELECT * FROM team_best_entries
                ORDER BY final_average_score DESC NULLS LAST, team_name ASC
            `;
            console.log("Leaderboard Result:");
            console.table(leaderboard);
        }
    } catch (e) {
        console.error(e);
    }
}

deepDive();
