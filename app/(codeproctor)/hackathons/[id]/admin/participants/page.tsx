"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Users, ShieldAlert } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

interface Participant {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    team_name?: string;
    team_id?: string;
}

export default function AdminParticipantsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);

    const hackathonId = params.id as string;

    const fetchParticipants = async () => {
        try {
            const res = await fetch(`/api/hackathons/${hackathonId}/participants`);
            if (res.ok) {
                const data = await res.json();
                setParticipants(data);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to fetch participants");
                if (res.status === 403) {
                    router.push(`/hackathons/${hackathonId}`);
                }
            }
        } catch (error) {
            toast.error("Error fetching participants");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hackathonId) {
            fetchParticipants();
        }
    }, [hackathonId]);

    const handleRemove = async (userId: string) => {
        setRemoving(userId);
        try {
            const res = await fetch(`/api/hackathons/${hackathonId}/participants`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: userId })
            });

            if (res.ok) {
                toast.success("Participant removed");
                setParticipants(prev => prev.filter(p => p.id !== userId));
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to remove participant");
            }
        } catch (error) {
            toast.error("Error removing participant");
        } finally {
            setRemoving(null);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="container max-w-5xl mx-auto py-10 space-y-8">
            <div className="flex items-center space-x-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/hackathons/${hackathonId}`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Manage Participants</h1>
                    <p className="text-muted-foreground">Hackathon ID: {hackathonId}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Participant List
                    </CardTitle>
                    <CardDescription>
                        Total Participants: {participants.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Team Status</TableHead>
                                <TableHead>Joined At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No participants yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                participants.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">{p.name}</TableCell>
                                        <TableCell>{p.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{p.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {p.team_name ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                    {p.team_name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No Team</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {p.role === 'PARTICIPANT' && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to remove <strong>{p.name}</strong> from this hackathon?
                                                                They will be removed from any team they are currently in. This action cannot be undone easily.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={() => handleRemove(p.id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                {removing === p.id ? "Removing..." : "Remove"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
