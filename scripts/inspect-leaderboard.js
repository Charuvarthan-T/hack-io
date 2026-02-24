require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
async function inspectLeaderboardData(hackathonId) {
    try {
        console.log(`Inspecting data for Hackathon: ${hackathonId}`);
        const teams = await sql`
            SELECT id, name FROM hackathon_teams
            WHERE hackathon_id = ${hackathonId}
        `;
        console.log("\nTeams in Hackathon:");
        console.table(teams);
        const submissions = await sql`
            SELECT id, team_id, status, submitted_at FROM submissions
            WHERE hackathon_id = ${hackathonId}
        `;
        console.log("\nSubmissions in Hackathon:");
        console.table(submissions);
        const evaluations = await sql`
            SELECT submission_id, judge_id, is_draft FROM hackathon_evaluations
        `;
        console.log("\nAll Evaluations (Total):", evaluations.length);
        const rawLeaderboard = await sql`
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
                WHERE s.hackathon_id = ${hackathonId} AND s.status = 'SUBMITTED'
                GROUP BY s.id
            )
            SELECT DISTINCT ON (t.id)
                ss.submission_id,
                t.name as team_name,
                t.id as team_id,
                ss.final_average_score,
                ss.judge_count
            FROM hackathon_teams t
            JOIN submission_scores ss ON t.id = ss.team_id
            ORDER BY t.id, ss.final_average_score DESC NULLS LAST
        `;
        console.log("\nRaw Leaderboard Results:");
        console.table(rawLeaderboard);
    } catch (error) {
        console.error("Inspection failed:", error);
    }
}
async function findLatestHackathon() {
    try {
        const hacks = await sql`SELECT id, title FROM hackathons ORDER BY created_at DESC LIMIT 5`;
        console.log("\nRecent Hackathons:");
        console.table(hacks);
        if (hacks.length > 0) {
            await inspectLeaderboardData(hacks[0].id);
        }
    } catch (e) {
        console.error("Find latest failed:", e);
    }
}
findLatestHackathon();
