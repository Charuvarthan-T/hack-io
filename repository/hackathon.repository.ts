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
}

// ==================== Hackathon CRUD ====================

export async function createHackathon(data: CreateHackathonDTO) {
  try {
    const result = await sql`
      INSERT INTO hackathons (title, description, start_date, end_date, created_by, status)
      VALUES (${data.title}, ${data.description || null}, ${data.start_date}, ${data.end_date}, ${data.created_by}, ${data.status || 'DRAFT'})
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

export async function deleteHackathon(id: string) {
  try {
    const result = await sql`DELETE FROM hackathons WHERE id = ${id} RETURNING *`;
    return result[0];
  } catch (error) {
    console.error("Error deleting hackathon:", error);
    throw error;
  }
}

// ==================== Role Management ====================

export async function addParticipant(hackathonId: string, userId: string, role: HackathonRole) {
  try {
    // Constraint check is handled by DB unique index, but we can double check logic here if needed
    const result = await sql`
      INSERT INTO hackathon_participants (hackathon_id, user_id, role)
      VALUES (${hackathonId}, ${userId}, ${role})
      ON CONFLICT (hackathon_id, user_id) 
      DO UPDATE SET role = ${role} -- Allow updating role if needed, or we could throw
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

// ==================== Blind Judging Data Access ====================

// This function purposely excludes user/team identity information
export async function getSubmissionForBlindJudging(submissionId: string) {
  try {
    // Assumes a 'submissions' table exists (from standard contest repo) or will be used.
    // For Hack.io, let's assume we reuse `contest_submissions` or a similar structure.
    // We strictly select ONLY content fields, NO user_id join for names.
    
    // Note: Adjust table names if we are reusing contest_submissions or creating new hackathon_submissions.
    // For now, assuming similar structure to contest_submissions but we need to ensure we don't leak user info.
    
    /* 
       Hypothetical query assuming we link problems to hackathons (via contest mechanisms) 
       and use contest_submissions. 
    */
    const result = await sql`
      SELECT 
        id,
        problem_id,
        code_content, -- hypothetical field
        language,
        submission_time
      FROM contest_submissions 
      WHERE id = ${submissionId}
    `;
    
    return result[0] || null;
  } catch (error) {
    console.error("Error getting blind submission:", error);
    throw error;
  }
}
