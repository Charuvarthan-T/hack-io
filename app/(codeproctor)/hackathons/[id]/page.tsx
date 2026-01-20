"use client";


import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Users, Clock, ArrowRight, UserPlus, Users as UsersIcon, Settings, Send } from "lucide-react";
import { SubmissionModal } from "@/components/hackathon/SubmissionModal";
import { AssignJudgesDialog } from "@/components/hackathon/AssignJudgesDialog";


interface HackathonDetails {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
    max_team_size: number;
    user_status: {
        role: "ORGANIZER" | "PARTICIPANT" | "JUDGE" | "MENTOR" | null;
        team: {
            id: string;
            name: string;
            member_count: number;
        } | null;
    };
}

export default function HackathonDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [hackathon, setHackathon] = useState<HackathonDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Countdown State
    const [timeLeft, setTimeLeft] = useState<string>("");

    const fetchDetails = async () => {
        try {
            const res = await fetch(`/api/hackathons/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setHackathon(data);
            } else {
                toast.error("Hackathon not found");
                router.push("/hackathons");
            }
        } catch (error) {
            console.error("Error fetching hackathon details", error);
        } finally {
            setLoading(false);
        }
    };

    // ...existing code...
    useEffect(() => {
        if (params.id) {
            fetchDetails();
        }
    }, [params.id]);

    // Timer Logic
    useEffect(() => {
        if (!hackathon) return;

        let targetDate: Date;
        const now = new Date();
        const startDate = new Date(hackathon.start_date);
        const endDate = new Date(hackathon.end_date);

        let mode: 'START' | 'END' = 'START';

        if (hackathon.status === 'PUBLISHED') {
            if (now > startDate) {
                // If start date passed, count down to end (Treat as implicit Active for UI)
                targetDate = endDate;
                mode = 'END';
            } else {
                targetDate = startDate;
                mode = 'START';
            }
        } else if (hackathon.status === 'ACTIVE') {
            targetDate = endDate;
            mode = 'END';
        } else {
            setTimeLeft("");
            return;
        }

        const updateTimer = () => {
            const currentTime = new Date();
            const diff = targetDate.getTime() - currentTime.getTime();

            if (diff <= 0) {
                if (mode === 'START') {
                    // Should technically not happen due to check above, but purely for transition
                    setTimeLeft("Started");
                } else {
                    setTimeLeft("Ended");
                }
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        };

        const interval = setInterval(updateTimer, 1000); // Update every second
        updateTimer();

        return () => clearInterval(interval);
    }, [hackathon]);

    const handleJoin = async () => {
        try {
            const res = await fetch(`/api/hackathons/${hackathon?.id}/join`, { method: "POST" });
            if (res.ok) {
                toast.success("Joined successfully!");
                fetchDetails(); // Refresh to update state
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to join");
            }
        } catch (e) { toast.error("Error joining"); }
    };

    // Team Creation State
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);

    const handleCreateTeam = () => {
        setIsTeamDialogOpen(true);
    };

    const submitCreateTeam = async () => {
        // ... existing code ...
        // (collapsed in diff for brevity, ensure existing function is preserved or use multi_replace for cleaner insert)
        // Since I'm using replace_file_content with range, I should just append after it.
        // Wait, I can't easily append without context.
        // I will replace the submitCreateTeam and add the new one after.
        if (!teamName) {
            toast.error("Please enter a team name");
            return;
        }
        setIsCreatingTeam(true);
        try {
            const res = await fetch(`/api/hackathons/${hackathon?.id}/teams`, {
                method: "POST",
                body: JSON.stringify({ name: teamName })
            });
            if (res.ok) {
                toast.success("Team created!");
                setIsTeamDialogOpen(false);
                fetchDetails(); // Refresh
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create team");
            }
        } catch (error) {
            toast.error("Error creating team");
        } finally {
            setIsCreatingTeam(false);
        }
    };

    // Add Member State
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);

    const handleAddMember = async () => {
        if (!inviteEmail) return;
        setIsInviting(true);
        try {
            const res = await fetch(`/api/hackathons/${hackathon?.id}/teams/members`, {
                method: "POST",
                body: JSON.stringify({ email: inviteEmail })
            });
            if (res.ok) {
                toast.success("Member added!");
                setIsAddMemberOpen(false);
                setInviteEmail("");
                fetchDetails();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to add member");
            }
        } catch (error) {
            toast.error("Error adding member");
        } finally {
            setIsInviting(false);
        }
    };

    const handleEnterWorkspace = () => {
        if (hackathon?.user_status.team) {
            router.push(`/hackathons/${hackathon.id}/team/${hackathon.user_status.team.id}`);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center py-20">Loading...</div>;
    }

    if (!hackathon) {
        return <div className="flex justify-center items-center py-20">Hackathon not found</div>;
    }

    const { status, user_status } = hackathon;
    const isJoined = !!user_status.role;
    const hasTeam = !!user_status.team;

    const isOrganizerOrAdmin = user_status?.role === 'ORGANIZER' || session?.user?.role === 'admin';

    return (
        <div className="container max-w-4xl mx-auto py-10 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Badge className="mb-2" variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight">{hackathon.title}</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-muted-foreground">
                            Hosted by Protocol (Organizer)
                        </p>
                        {isOrganizerOrAdmin && (
                            <Button variant="outline" size="sm" onClick={() => router.push(`/hackathons/${hackathon.id}/admin/participants`)}>
                                <UsersIcon className="h-4 w-4 mr-2" /> Manage Participants
                            </Button>
                        )}
                        {isOrganizerOrAdmin && (
                            <Button variant="outline" size="sm" onClick={() => router.push(`/hackathons/${hackathon.id}/admin/settings`)}>
                                <Settings className="h-4 w-4 mr-2" /> Settings
                            </Button>
                        )}
                        {isOrganizerOrAdmin && (
                            <AssignJudgesDialog hackathonId={hackathon.id} trigger={<Button variant="outline" size="sm">Assign Judges</Button>} />
                        )}
                    </div>
                </div>

                {/* Countdown Card */}
                {(status === 'PUBLISHED' || status === 'ACTIVE') && (
                    <Card className="min-w-[200px] bg-secondary/50 border-none">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {status === 'ACTIVE' ? "Ends In" :
                                    (status === 'PUBLISHED' && new Date() > new Date(hackathon.start_date) ? "Ends In" : "Starts In")
                                }
                            </p>
                            <p className={`text-2xl font-mono font-bold mt-1 ${(status === 'ACTIVE' || (status === 'PUBLISHED' && new Date() > new Date(hackathon.start_date)))
                                    ? 'text-red-500' : 'text-primary'
                                }`}>
                                {timeLeft}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Description */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>About this Hackathon</CardTitle>
                        </CardHeader>
                        <CardContent className="prose dark:prose-invert">
                            <p className="whitespace-pre-wrap">{hackathon.description || "No description provided."}</p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-4 flex items-center space-x-4">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Calendar className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Start Date</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(hackathon.start_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center space-x-4">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <Clock className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">End Date</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(hackathon.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-2 md:col-span-1">
                            <CardContent className="p-4 flex items-center space-x-4">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <UsersIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Team Size</p>
                                    <p className="text-sm text-muted-foreground">
                                        Max {hackathon.max_team_size} members
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Actions & Status */}
                <div className="space-y-6">

                    {/* Primary Action Card */}
                    <Card className="border-primary/20 shadow-lg">
                        <CardHeader>
                            <CardTitle>Your Status</CardTitle>
                            <CardDescription>
                                {isJoined
                                    ? `You are joined as ${user_status.role}`
                                    : "Join to participate in this event"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* ACTION 1: Join */}
                            {!isJoined && status === 'PUBLISHED' && (
                                <Button
                                    className="w-full h-12 text-lg"
                                    onClick={handleJoin}
                                >
                                    <UserPlus className="mr-2 h-5 w-5" /> Join Hackathon
                                </Button>
                            )}

                            {/* ACTION 2: Create Team */}
                            {isJoined && !hasTeam && user_status.role === 'PARTICIPANT' && (status === 'PUBLISHED' || status === 'ACTIVE') && (
                                <div className="space-y-2">
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-500">
                                        ⚠️ You need a team to compete.
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant="default"
                                        onClick={handleCreateTeam}
                                    >
                                        <UsersIcon className="mr-2 h-4 w-4" /> Create Team
                                    </Button>
                                </div>
                            )}

                            {/* ACTION 3: Workspace */}
                            {hasTeam && (
                                <div className="space-y-3">
                                    <div className="p-3 bg-secondary rounded-md">
                                        <p className="text-sm font-medium">Team: {user_status.team?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {user_status.team?.member_count} / {hackathon.max_team_size} Members
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant="secondary"
                                        onClick={handleEnterWorkspace}
                                    >
                                        Enter Workspace <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>

                                    {/* Add Member Button - Only if space available */}
                                    {(user_status.team?.member_count || 0) < (hackathon.max_team_size || 4) && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setIsAddMemberOpen(true)}
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" /> Add Member
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* State: Completed */}
                            {status === 'COMPLETED' && (
                                <div className="p-3 bg-muted rounded-md text-center text-sm">
                                    This hackathon has ended.
                                </div>
                            )}

                            {/* ACTION 4: Submit Project */}
                            {isJoined && hasTeam && (status === 'ACTIVE') && (
                                <SubmissionModal 
                                    hackathonId={hackathon.id} 
                                    trigger={
                                        <Button className="w-full" variant="default">
                                            <Send className="mr-2 h-4 w-4" /> Submit Project
                                        </Button>
                                    }
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Resources ... */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Resources</CardTitle>
                            <div className="h-0.5 w-10 bg-primary mt-2 rounded-full" />
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <a href="#" className="block text-primary hover:underline">Rulebook</a>
                            <a href="#" className="block text-primary hover:underline">Code of Conduct</a>
                            <a href="#" className="block text-primary hover:underline">Help Center</a>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Create Team Dialog */}
            <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a Team</DialogTitle>
                        <DialogDescription>
                            Create a new team to start working. You can invite other members later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="teamName">Team Name</Label>
                            <Input
                                id="teamName"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g. The Dream Team"
                            />
                        </div>
                        <Button className="w-full" onClick={submitCreateTeam} disabled={isCreatingTeam}>
                            {isCreatingTeam ? "Creating..." : "Create Team"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Add Member Dialog */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                            Enter the email of the participant you want to add. They must have already joined the hackathon.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="inviteEmail">User Email</Label>
                            <Input
                                id="inviteEmail"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="student@example.com"
                            />
                        </div>
                        <Button className="w-full" onClick={handleAddMember} disabled={isInviting}>
                            {isInviting ? "Adding..." : "Add Member"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
