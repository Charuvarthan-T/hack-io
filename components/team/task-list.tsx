
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CreateTaskDialog } from "./create-task-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";

interface __Task {
    id: string;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    due_at: string | null;
    assigned_to: string | null;
    assignee_name?: string;
    assignee_image?: string;
}

export function TaskList({ members }: { members: any[] }) {
    const params = useParams();
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<__Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`/api/hackathons/${params.id}/team/${params.teamId}/tasks`, {
                cache: "no-store"
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error("Failed to fetch tasks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.teamId) {
            fetchTasks();
        }
    }, [params.teamId]);

    const handleToggleStatus = async (task: __Task) => {
        // Optimistic update
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        const oldStatus = task.status;
        
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            const res = await fetch(`/api/hackathons/${params.id}/team/${params.teamId}/tasks/${task.id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error();
        } catch (e) {
            toast.error("Failed to update status");
            // Revert
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: oldStatus } : t));
        }
    };

    const handleDelete = async (taskId: string) => {
        if(!confirm("Delete this task?")) return;
        
        try {
            const res = await fetch(`/api/hackathons/${params.id}/team/${params.teamId}/tasks/${taskId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
                toast.success("Task deleted");
            }
        } catch (e) {
            toast.error("Failed to delete task");
        }
    }

    if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading tasks...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Team Tasks</h3>
                <CreateTaskDialog onTaskCreated={fetchTasks} members={members} />
            </div>

            <div className="rounded-md border bg-card">
                {tasks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        No tasks yet. Create one to get started!
                    </div>
                ) : (
                    <div className="divide-y">
                        {tasks.map((task) => (
                            <div key={task.id} className="group flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                                {/* Checkbox / Status Toggle */}
                                <Checkbox 
                                    checked={task.status === 'DONE'}
                                    onCheckedChange={() => handleToggleStatus(task)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm font-medium truncate",
                                        task.status === 'DONE' && "text-muted-foreground line-through"
                                    )}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        {task.status !== 'DONE' && task.due_at && (
                                            <span className={cn( new Date(task.due_at) < new Date() ? "text-destructive" : "")}>
                                                Due {format(new Date(task.due_at), "MMM d")}
                                            </span>
                                        )}
                                        {task.description && (
                                            <span className="truncate max-w-[200px] hidden sm:inline-block">
                                                {task.description}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata / Actions */}
                                <div className="flex items-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {/* Assignee Avatar */}
                                    {task.assignee_name && (
                                        <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee_name}`}>
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={task.assignee_image} />
                                                <AvatarFallback className="text-[9px]">
                                                    {task.assignee_name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    )}
                                    
                                    {/* Delete Action */}
                                    <button 
                                        onClick={() => handleDelete(task.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
