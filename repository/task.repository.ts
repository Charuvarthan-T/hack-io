
import sql from "@/lib/db";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
    id: string;
    team_id: string;
    title: string;
    description: string | null;
    assigned_by: string;
    assigned_to: string | null;
    status: TaskStatus;
    due_at: Date | null;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
    // Joined fields
    assignee_name?: string;
    assignee_image?: string;
    creator_name?: string;
}

export interface CreateTaskDTO {
    team_id: string;
    title: string;
    description?: string;
    assigned_by: string;
    assigned_to?: string;
    due_at?: Date;
}

export interface UpdateTaskDTO {
    title?: string;
    description?: string;
    assigned_to?: string | null;
    status?: TaskStatus;
    due_at?: Date | null;
}

export async function createTask(data: CreateTaskDTO) {
    try {
        const result = await sql`
            INSERT INTO hackathon_tasks 
            (team_id, title, description, assigned_by, assigned_to, due_at, status)
            VALUES 
            (${data.team_id}, ${data.title}, ${data.description || null}, ${data.assigned_by}, ${data.assigned_to || null}, ${data.due_at || null}, 'TODO')
            RETURNING *
        `;
        return result[0] as Task;
    } catch (error) {
        console.error("Error creating task:", error);
        throw error;
    }
}

export async function getTasksByTeam(teamId: string) {
    try {
        const result = await sql`
            SELECT 
                t.*,
                u1.name as assignee_name,
                u1.image as assignee_image,
                u2.name as creator_name
            FROM hackathon_tasks t
            LEFT JOIN users u1 ON t.assigned_to::uuid = u1.id
            LEFT JOIN users u2 ON t.assigned_by::uuid = u2.id
            WHERE t.team_id = ${teamId}::uuid
            ORDER BY 
                CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END, -- Done items at bottom
                t.due_at ASC NULLS LAST, -- Soonest due first
                t.created_at DESC -- Newest first fallback
        `;
        return result as Task[];
    } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
    }
}

export async function updateTask(taskId: string, data: UpdateTaskDTO) {
    try {
        // Construct dynamic update
        // Note: For simplicity in this raw SQL setup helpers, we'll do individual checks 
        // or a slightly more verbose query. Since neon doesn't support dynamic builder out of box easily without helper:

        // We'll calculate completed_at logic here
        let completedAtSnippet = sql``;
        if (data.status === 'DONE') {
            completedAtSnippet = sql`, completed_at = NOW()`;
        } else if (data.status) {
            completedAtSnippet = sql`, completed_at = NULL`;
        }

        const result = await sql`
            UPDATE hackathon_tasks
            SET 
                updated_at = NOW()
                ${data.title !== undefined ? sql`, title = ${data.title}` : sql``}
                ${data.description !== undefined ? sql`, description = ${data.description}` : sql``}
                ${data.assigned_to !== undefined ? sql`, assigned_to = ${data.assigned_to}` : sql``}
                ${data.status !== undefined ? sql`, status = ${data.status}` : sql``}
                ${data.due_at !== undefined ? sql`, due_at = ${data.due_at}` : sql``}
                ${completedAtSnippet}
            WHERE id = ${taskId}
            RETURNING *
        `;
        return result[0] as Task;
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }
}

export async function deleteTask(taskId: string) {
    try {
        const result = await sql`
            DELETE FROM hackathon_tasks WHERE id = ${taskId} RETURNING *
        `;
        return result[0];
    } catch (error) {
        console.error("Error deleting task:", error);
        throw error;
    }
}
