
import sql from "@/lib/db";

// Role Enum
export type HackathonRole = "ORGANIZER" | "PARTICIPANT" | "JUDGE" | "MENTOR";

// Hackathon Interface
export interface Hackathon {
    id: string;
    title: string;
    description: string | null;
    start_date: Date;
    end_date: Date;
    status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
    created_by: string;
    max_team_size: number;
    created_at: Date;
    updated_at: Date;
}

// Hackathon Participant Interface
export interface HackathonParticipant {
    id: string;
    hackathon_id: string;
    user_id: string;
    role: HackathonRole;
    created_at: Date;
}

// DTOs
export interface CreateHackathonDTO {
    title: string;
    description?: string;
    start_date: Date;
    end_date: Date;
    created_by: string;
    status?: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
    max_team_size?: number;
}

// ==================== Hackathon CRUD ====================

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

        // Join to get the specific user's role if it exists, and count total participants
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

// ==================== Role Management ====================

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
            SELECT 
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
            ORDER BY hp.created_at DESC
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

// ==================== Blind Judging Data Access ====================

// This function purposely excludes user/team identity information
export async function getSubmissionForBlindJudging(submissionId: string) {
    try {
        const result = await sql`
      SELECT 
        id,
        problem_id,
        code_content, 
        language,
        submission_time
      FROM contest_submissions 
      WHERE id = ${submissionId}
    `;
    } catch (error) {
        console.error("Error getting blind submission:", error);
        throw error;
    }
}

// ==================== Team Management ====================

export interface CreateTeamDTO {
    hackathon_id: string;
    name: string;
    created_by: string;
}

export async function createTeam(data: CreateTeamDTO) {
    try {
        const team = await sql`
            INSERT INTO hackathon_teams (hackathon_id, name, created_by)
            VALUES (${data.hackathon_id}, ${data.name}, ${data.created_by})
            RETURNING *
        `;

        // Add creator as first member
        await sql`
            INSERT INTO hackathon_team_members (team_id, user_id)
            VALUES (${team[0].id}, ${data.created_by})
        `;

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