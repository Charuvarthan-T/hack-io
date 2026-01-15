import sql from "@/lib/db";

export interface Submission {
    id: string;
    hackathon_id: string;
    team_id: string;
    repo_url: string;
    ppt_object_key: string;
    status: "DRAFT" | "SUBMITTED";
    created_at: Date;
    submitted_at: Date;
}

export interface CreateSubmissionDTO {
    hackathon_id: string;
    team_id: string;
    repo_url: string;
    ppt_object_key: string;
    status?: "DRAFT" | "SUBMITTED";
}

export async function createSubmission(data: CreateSubmissionDTO) {
    try {
        const result = await sql`
            INSERT INTO submissions (hackathon_id, team_id, repo_url, ppt_object_key, status)
            VALUES (${data.hackathon_id}, ${data.team_id}, ${data.repo_url}, ${data.ppt_object_key}, ${data.status || 'SUBMITTED'})
            RETURNING *
        `;
        return result[0] as Submission;
    } catch (error) {
        console.error("Error creating submission:", error);
        throw error;
    }
}

export async function getSubmissionByTeam(hackathonId: string, teamId: string) {
    try {
        const result = await sql`
            SELECT * FROM submissions 
            WHERE hackathon_id = ${hackathonId} AND team_id = ${teamId}
            ORDER BY submitted_at DESC
            LIMIT 1
        `;
        return (result[0] as Submission) || null;
    } catch (error) {
        console.error("Error getting submission:", error);
        throw error;
    }
}

export async function getSubmissionById(id: string) {
    try {
        const result = await sql`
            SELECT * FROM submissions WHERE id = ${id}
        `;
        return (result[0] as Submission) || null;
    } catch (error) {
        console.error("Error getting submission:", error);
        throw error;
    }
}
