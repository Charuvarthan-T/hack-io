import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    try {
        const sub = await sql`SELECT id FROM submissions LIMIT 1`;
        const judge = await sql`SELECT user_id FROM hackathon_participants WHERE role = 'JUDGE' LIMIT 1`;
        
        if (!sub[0] || !judge[0]) {
            console.error("Could not find submission or judge");
            return;
        }

        const data = {
            submission_id: sub[0].id,
            judge_id: judge[0].user_id,
            innovation_score: 5,
            technical_complexity_score: 5,
            implementation_quality_score: 5,
            ui_ux_score: 5,
            impact_score: 5,
            presentation_quality_score: 5,
            ui_score: 5,
            backend_score: 5,
            graphs_score: 5,
            discord_interaction_score: 5,
            feedback: "test feedback",
            is_draft: true
        };

        console.log("Attempting to save evaluation:", data);

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
        console.log("Success:", result[0]);

    } catch (error) {
        console.error("Detailed catch error:", error);
    }
}

main();
