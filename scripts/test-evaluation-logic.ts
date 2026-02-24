import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { createOrUpdateEvaluation, getHackathonLeaderboard } from "../repository/evaluation.repository";
const connection_string = process.env.DATABASE_URL;
const sql = neon(connection_string!);
async function test() {
    console.log("Starting Targeted Verification Tests...");
    try {
        const hackathonId = 'e2817b30-b950-4738-9ac9-c0959e1903ba';
        const submissionId = '9dbcce52-2b4b-4cb0-a506-cb0d74ca017d';
        const users = await sql`SELECT id FROM users LIMIT 3`;
        if (users.length < 3) throw new Error("Need 3 users");
        const judge1Id = users[0].id;
        const judge2Id = users[1].id;
        const judge3Id = users[2].id;
        console.log(`Phase 1: Submitting Evaluations for Submission ${submissionId}`);
        await createOrUpdateEvaluation({
            submission_id: submissionId,
            judge_id: judge1Id,
            innovation_score: 10, technical_complexity_score: 10, implementation_quality_score: 10,
            ui_ux_score: 10, impact_score: 10, presentation_quality_score: 10, is_draft: false
        });
        await createOrUpdateEvaluation({
            submission_id: submissionId,
            judge_id: judge2Id,
            innovation_score: 5, technical_complexity_score: 5, implementation_quality_score: 5,
            ui_ux_score: 5, impact_score: 5, presentation_quality_score: 5, is_draft: false
        });
        await createOrUpdateEvaluation({
            submission_id: submissionId,
            judge_id: judge3Id,
            innovation_score: 0, technical_complexity_score: 0, implementation_quality_score: 0,
            ui_ux_score: 0, impact_score: 0, presentation_quality_score: 0, is_draft: false
        });
        console.log("Phase 2: Verifying Dashboard Score Averaging");
        const leaderboard = await getHackathonLeaderboard(hackathonId);
        const entry = leaderboard.find((e: any) => e.submission_id === submissionId);
        console.log("Leaderboard Result:", entry);
        const expectedAverage = 30.0;
        const actualAverage = Number(entry.final_average_score);
        if (Math.abs(actualAverage - expectedAverage) < 0.01) {
            console.log(`✅ Success! Average score is ${actualAverage}`);
        } else {
            console.error(`❌ Failure! Expected ${expectedAverage}, got ${actualAverage}`);
        }
    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        process.exit(0);
    }
}
test();
