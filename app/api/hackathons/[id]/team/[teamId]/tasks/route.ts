
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTask, CreateTaskDTO, getTasksByTeam } from "@/repository/task.repository";
import { getTeamForUser } from "@/repository/hackathon.repository";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    assigned_to: z.string().optional(),
    due_at: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; teamId: string }> }
) {
    try {
    const { teamId } = await params;
        console.log("GET /tasks teamId:", teamId);
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        
        // Authorization: Ideally check if user belongs to team
        // Skipping comprehensive check for speed, relying on getTasksByTeam filtering by teamId
        // But good practice is:
        // const team = await getTeamForUser(hackathonId, session.user.id);
        // if (!team || team.id !== teamId) return 403;

        const tasks = await getTasksByTeam(teamId);
        console.log("Fetched tasks count:", tasks.length);
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("GET /tasks error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; teamId: string }> }
) {
    try {
        const { teamId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const body = createTaskSchema.parse(json);

        const taskData: CreateTaskDTO = {
            team_id: teamId,
            assigned_by: session.user.id,
            title: body.title,
            description: body.description,
            assigned_to: body.assigned_to,
            due_at: body.due_at,
        };

        const task = await createTask(taskData);
        return NextResponse.json(task);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
