import sql from "@/lib/db";
export type HackathonRole = "ORGANIZER" | "PARTICIPANT" | "JUDGE" | "MENTOR";
export interface Hackathon {
    id: string;
    title: string;
    description: string | null;
    start_date: Date;
    end_date: Date;
    status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
    phase: "SUBMISSION" | "EVALUATION" | "RESULTS";
    created_by: string;
    max_team_size: number;
    created_at: Date;
    updated_at: Date;
    discord_enabled?: boolean;
    discord_server_type?: "INTERNAL" | "EXTERNAL";
    discord_invite_link?: string;
    discord_category_id?: string;
}
export interface HackathonParticipant {
    id: string;
    hackathon_id: string;
    user_id: string;
    role: HackathonRole;
    created_at: Date;
}
export interface CreateHackathonDTO {
    title: string;
    description?: string;
    start_date: Date;
    end_date: Date;
    created_by: string;
    status?: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
    max_team_size?: number;
}
export async function createHackathon(data: CreateHackathonDTO) {
    try {
        const result = await sql`
      INSERT INTO hackathons (title, description, start_date, end_date, created_by, status, max_team_size)
      VALUES (${data.title}, ${data.description || null}, ${data.start_date}, ${data.end_date}, ${data.created_by}, ${data.status || 'DRAFT'}, ${data.max_team_size || 4})
      RETURNING *
    `;
        return result[0] as Hackathon;
    } catch (error) {
        console.error("Error creating hackathon:", error);
        throw error;
    }
}
export async function getHackathonById(id: string) {
    try {
        const result = await sql`SELECT * FROM hackathons WHERE id = ${id}`;
        return result[0] as Hackathon || null;
    } catch (error) {
        console.error("Error getting hackathon:", error);
        throw error;
    }
}
export async function getHackathonsWithUserRole(userId?: string) {
    try {
        if (!userId) {
            return await sql`SELECT *, NULL as user_role FROM hackathons ORDER BY created_at DESC`;
        }
        const result = await sql`
            SELECT
                h.*,
                hp.role as user_role,
                (SELECT COUNT(*) FROM hackathon_participants WHERE hackathon_id = h.id AND role = 'PARTICIPANT') as participant_count
            FROM hackathons h
            LEFT JOIN hackathon_participants hp
            ON h.id = hp.hackathon_id AND hp.user_id = ${userId}
            ORDER BY h.created_at DESC
        `;
        return result as (Hackathon & { user_role: HackathonRole | null, participant_count: number })[];
    } catch (error) {
        console.error("Error fetching hackathons:", error);
        throw error;
    }
}
export async function deleteHackathon(id: string) {
    try {
        const result = await sql`DELETE FROM hackathons WHERE id = ${id} RETURNING *`;
        return result[0];
    } catch (error) {
        console.error("Error deleting hackathon:", error);
        throw error;
    }
}
export async function updateHackathonStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED") {
    try {
        const result = await sql`
      UPDATE hackathons
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
        return result[0] as Hackathon;
    } catch (error) {
        console.error("Error updating hackathon status:", error);
        throw error;
    }
}
export async function addParticipant(hackathonId: string, userId: string, role: HackathonRole) {
    try {
        const result = await sql`
      INSERT INTO hackathon_participants (hackathon_id, user_id, role)
      VALUES (${hackathonId}, ${userId}, ${role})
      ON CONFLICT (hackathon_id, user_id)
      DO UPDATE SET role = ${role}
      RETURNING *
    `;
        return result[0] as HackathonParticipant;
    } catch (error) {
        console.error("Error adding participant:", error);
        throw error;
    }
}
export async function getUserRole(hackathonId: string, userId: string): Promise<HackathonRole | null> {
    try {
        const result = await sql`
      SELECT role FROM hackathon_participants
      WHERE hackathon_id = ${hackathonId} AND user_id = ${userId}
    `;
        return result[0]?.role as HackathonRole || null;
    } catch (error) {
        console.error("Error getting user role:", error);
        throw error;
    }
}
export async function getHackathonParticipants(hackathonId: string) {
    try {
        const result = await sql`
            SELECT DISTINCT ON (u.id)
                u.id,
                u.name,
                u.email,
                hp.role,
                hp.created_at,
                t.name as team_name,
                t.id as team_id
            FROM hackathon_participants hp
            JOIN users u ON hp.user_id = u.id
            LEFT JOIN hackathon_team_members tm ON u.id = tm.user_id
            LEFT JOIN hackathon_teams t ON tm.team_id = t.id AND t.hackathon_id = hp.hackathon_id
            WHERE hp.hackathon_id = ${hackathonId}
            ORDER BY u.id, hp.created_at DESC
        `;
        return result;
    } catch (error) {
        console.error("Error getting participants:", error);
        throw error;
    }
}
export async function removeHackathonParticipant(hackathonId: string, userId: string) {
    try {
        const result = await sql`
      DELETE FROM hackathon_participants
      WHERE hackathon_id = ${hackathonId} AND user_id = ${userId}
      RETURNING *
    `;
        return result[0];
    } catch (error) {
        console.error("Error removing participant:", error);
        throw error;
    }
}
export async function getSubmissionForBlindJudging(submissionId: string) {
    try {
        const result = await sql`
      SELECT
        s.id,
        s.hackathon_id,
        s.repo_url,
        s.ppt_object_key,
        s.submitted_at,
        h.title as hackathon_title
      FROM submissions s
      JOIN hackathons h ON s.hackathon_id = h.id
      WHERE s.id = ${submissionId}
    `;
        return result[0] || null;
    } catch (error) {
        console.error("Error getting blind submission:", error);
        throw error;
    }
}
export async function getAssignedSubmissionsForJudge(hackathonId: string, judgeId: string) {
    try {
        const result = await sql`
            SELECT
                s.id,
                s.submitted_at,
                (SELECT id FROM hackathon_evaluations WHERE submission_id = s.id AND judge_id = ${judgeId}) as evaluation_id,
                (SELECT is_draft FROM hackathon_evaluations WHERE submission_id = s.id AND judge_id = ${judgeId}) as is_draft
            FROM submissions s
            WHERE s.hackathon_id = ${hackathonId} AND s.status = 'SUBMITTED'
            ORDER BY s.submitted_at DESC
        `;
        return result;
    } catch (error) {
        console.error("Error getting assigned submissions:", error);
        throw error;
    }
}
export interface CreateTeamDTO {
    hackathon_id: string;
    name: string;
    created_by: string;
}
import { emitEvent } from "@/lib/events";
export async function createTeam(data: CreateTeamDTO) {
    try {
        const team = await sql`
            INSERT INTO hackathon_teams (hackathon_id, name, created_by)
            VALUES (${data.hackathon_id}, ${data.name}, ${data.created_by})
            RETURNING *
        `;
        await sql`
            INSERT INTO hackathon_team_members (team_id, user_id)
            VALUES (${team[0].id}, ${data.created_by})
        `;
        await emitEvent("team.created", {
            team_id: team[0].id,
            hackathon_id: data.hackathon_id,
            name: data.name,
            created_by: data.created_by
        });
        return team[0];
    } catch (error) {
        console.error("Error creating team:", error);
        throw error;
    }
}
export async function getTeamForUser(hackathonId: string, userId: string) {
    try {
        const result = await sql`
            SELECT t.*,
                   (SELECT COUNT(*) FROM hackathon_team_members WHERE team_id = t.id) as member_count
            FROM hackathon_teams t
            JOIN hackathon_team_members tm ON t.id = tm.team_id
            WHERE t.hackathon_id = ${hackathonId} AND tm.user_id = ${userId}
        `;
        return result[0] || null;
    } catch (error) {
        console.error("Error getting user team:", error);
        throw error;
    }
}
export async function joinTeam(teamId: string, userId: string) {
    try {
        const result = await sql`
            INSERT INTO hackathon_team_members (team_id, user_id)
            VALUES (${teamId}, ${userId})
            RETURNING *
        `;
        const team = await sql`SELECT hackathon_id FROM hackathon_teams WHERE id = ${teamId}`;
        await emitEvent("team.member.added", {
            team_id: teamId,
            hackathon_id: team[0]?.hackathon_id,
            user_id: userId
        });
        return result[0];
    } catch (error) {
        console.error("Error joining team:", error);
        throw error;
    }
}
export async function findUserByEmail(email: string) {
    try {
        const result = await sql`SELECT id, name, email, image FROM users WHERE email = ${email}`;
        return result[0];
    } catch (error) {
        console.error("Error finding user:", error);
        throw error;
    }
}
export async function getTeamMemberCount(teamId: string) {
    try {
        const result = await sql`
            SELECT COUNT(*) as count FROM hackathon_team_members WHERE team_id = ${teamId}
        `;
        return Number(result[0].count);
    } catch (error) {
        console.error("Error counting team members:", error);
        throw error;
    }
}
export async function getTeamMembers(teamId: string) {
    try {
        const result = await sql`
            SELECT u.id, u.name, u.email, u.image
            FROM hackathon_team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = ${teamId}
        `;
        return result;
    } catch (error) {
        console.error("Error getting team members:", error);
        throw error;
    }
}
export async function updateHackathonDiscordSettings(id: string, settings: { discord_enabled: boolean; discord_server_type?: "INTERNAL" | "EXTERNAL"; discord_invite_link?: string; discord_category_id?: string }) {
    try {
        const result = await sql`
            UPDATE hackathons
            SET discord_enabled = ${settings.discord_enabled},
                discord_server_type = ${settings.discord_server_type || null},
                discord_invite_link = ${settings.discord_invite_link || null},
                discord_category_id = ${settings.discord_category_id || null},
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        return result[0];
    } catch (error) {
        console.error("Error updating discord settings:", error);
        throw error;
    }
}
