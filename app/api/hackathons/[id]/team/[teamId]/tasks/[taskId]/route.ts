
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateTask, deleteTask, UpdateTaskDTO, TaskStatus } from "@/repository/task.repository";
import { z } from "zod";

const updateTaskSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    assigned_to: z.string().nullable().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    due_at: z.string().nullable().optional().transform(str => str ? new Date(str) : (str === null ? null : undefined)),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; teamId: string; taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const body = updateTaskSchema.parse(json);

        const updateData: UpdateTaskDTO = {
            title: body.title,
            description: body.description,
            assigned_to: body.assigned_to,
            status: body.status as TaskStatus,
            due_at: body.due_at,
        }

        const task = await updateTask(taskId, updateData);
        return NextResponse.json(task);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; teamId: string; taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await deleteTask(taskId);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
