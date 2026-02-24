import sql from "@/lib/db";
export interface Evaluation {
    id: string;
    submission_id: string;
    judge_id: string;
    innovation_score: number;
    technical_complexity_score: number;
    implementation_quality_score: number;
    ui_ux_score: number;
    impact_score: number;
    presentation_quality_score: number;
    ui_score: number;
    backend_score: number;
    graphs_score: number;
    discord_interaction_score: number;
    feedback: string | null;
    is_draft: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateEvaluationDTO {
    submission_id: string;
    judge_id: string;
    innovation_score: number;
    technical_complexity_score: number;
    implementation_quality_score: number;
    ui_ux_score: number;
    impact_score: number;
    presentation_quality_score: number;
    ui_score: number;
    backend_score: number;
    graphs_score: number;
    discord_interaction_score: number;
    feedback?: string;
    is_draft?: boolean;
}
export async function createOrUpdateEvaluation(data: CreateEvaluationDTO) {
    try {
        const result = await sql`
            INSERT INTO hackathon_evaluations (
                submission_id, judge_id, innovation_score, technical_complexity_score,
                implementation_quality_score, ui_ux_score, impact_score,
                presentation_quality_score, ui_score, backend_score,
                graphs_score, discord_interaction_score, feedback, is_draft, updated_at
            )
            VALUES (
                ${data.submission_id}, ${data.judge_id}, ${data.innovation_score},
                ${data.technical_complexity_score}, ${data.implementation_quality_score},
                ${data.ui_ux_score}, ${data.impact_score}, ${data.presentation_quality_score},
                ${data.ui_score}, ${data.backend_score}, ${data.graphs_score},
                ${data.discord_interaction_score}, ${data.feedback || null},
                ${data.is_draft || false}, NOW()
            )
            ON CONFLICT (submission_id, judge_id)
            DO UPDATE SET
                innovation_score = EXCLUDED.innovation_score,
                technical_complexity_score = EXCLUDED.technical_complexity_score,
                implementation_quality_score = EXCLUDED.implementation_quality_score,
                ui_ux_score = EXCLUDED.ui_ux_score,
                impact_score = EXCLUDED.impact_score,
                presentation_quality_score = EXCLUDED.presentation_quality_score,
                ui_score = EXCLUDED.ui_score,
                backend_score = EXCLUDED.backend_score,
                graphs_score = EXCLUDED.graphs_score,
                discord_interaction_score = EXCLUDED.discord_interaction_score,
                feedback = EXCLUDED.feedback,
                is_draft = EXCLUDED.is_draft,
                updated_at = NOW()
            RETURNING *
        `;
        return result[0] as Evaluation;
    } catch (error) {
        console.error("Error saving evaluation:", error);
        throw error;
    }
}
export async function getEvaluation(submissionId: string, judgeId: string) {
    try {
        const result = await sql`
            SELECT * FROM hackathon_evaluations
            WHERE submission_id = ${submissionId} AND judge_id = ${judgeId}
        `;
        return result[0] as Evaluation || null;
    } catch (error) {
        console.error("Error getting evaluation:", error);
        throw error;
    }
}
export async function getSubmissionEvaluations(submissionId: string) {
    try {
        const result = await sql`
            SELECT e.*, u.name as judge_name
            FROM hackathon_evaluations e
            JOIN users u ON e.judge_id = u.id
            WHERE e.submission_id = ${submissionId} AND e.is_draft = FALSE
        `;
        return result;
    } catch (error) {
        console.error("Error getting submission evaluations:", error);
        throw error;
    }
}
export async function getHackathonLeaderboard(hackathonId: string) {
    try {
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
                WHERE s.hackathon_id = ${hackathonId} AND s.status = 'SUBMITTED'
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
                WHERE t.hackathon_id = ${hackathonId}
                ORDER BY LOWER(TRIM(t.name)), ss.final_average_score DESC NULLS LAST
            )
            SELECT * FROM team_best_entries
            ORDER BY final_average_score DESC NULLS LAST, team_name ASC
        `;
        try {
            const fs = require('fs');
            const path = require('path');
            const debugFile = path.resolve(process.cwd(), 'leaderboard_debug.log');
            fs.appendFileSync(debugFile, `\n\n[${new Date().toISOString()}] Hackathon: ${hackathonId}\n` + JSON.stringify(leaderboard, null, 2) + '\n');
        } catch (e) {
            console.error("Failed to write leaderboard debug log", e);
        }
        return leaderboard;
    } catch (error) {
        console.error("Error fetching hackathon leaderboard:", error);
        throw error;
    }
}
export async function getAssignedHackathonsForJudge(judgeId: string) {
    try {
        const result = await sql`
            SELECT h.*,
                (SELECT COUNT(*) FROM submissions s WHERE s.hackathon_id = h.id AND s.status = 'SUBMITTED') as total_submissions,
                (SELECT COUNT(*) FROM hackathon_evaluations e
                 JOIN submissions s ON e.submission_id = s.id
                 WHERE s.hackathon_id = h.id AND e.judge_id = ${judgeId} AND e.is_draft = FALSE) as evaluated_submissions
            FROM hackathons h
            JOIN hackathon_participants hp ON h.id = hp.hackathon_id
            WHERE hp.user_id = ${judgeId} AND hp.role = 'JUDGE'
        `;
        return result;
    } catch (error) {
        console.error("Error getting assigned hackathons:", error);
        throw error;
    }
}
export async function getNextSubmissionToJudge(hackathonId: string, judgeId: string) {
    try {
        const result = await sql`
            SELECT s.id
            FROM submissions s
            WHERE s.hackathon_id = ${hackathonId}
            AND s.status = 'SUBMITTED'
            AND NOT EXISTS (
                SELECT 1 FROM hackathon_evaluations e
                WHERE e.submission_id = s.id
                AND e.judge_id = ${judgeId}
                AND e.is_draft = FALSE
            )
            ORDER BY s.submitted_at ASC
            LIMIT 1
        `;
        return result[0]?.id || null;
    } catch (error) {
        console.error("Error getting next submission:", error);
        throw error;
    }
}
