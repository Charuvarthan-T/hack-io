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
import { Calendar, Users, Clock, ArrowRight, UserPlus, Users as UsersIcon, Settings, Send, ShieldCheck, Trophy } from "lucide-react";
import { SubmissionModal } from "@/components/hackathon/SubmissionModal";
import { AssignJudgesDialog } from "@/components/hackathon/AssignJudgesDialog";
interface HackathonDetails {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
    phase: "SUBMISSION" | "EVALUATION" | "RESULTS";
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
    useEffect(() => {
        if (params.id) {
            fetchDetails();
        }
    }, [params.id]);
    useEffect(() => {
        if (!hackathon) return;
        let targetDate: Date;
        const now = new Date();
        const startDate = new Date(hackathon.start_date);
        const endDate = new Date(hackathon.end_date);
        let mode: 'START' | 'END' = 'START';
        if (hackathon.status === 'PUBLISHED') {
            if (now > startDate) {
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
        const interval = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(interval);
    }, [hackathon]);
    const handleJoin = async () => {
        try {
            const res = await fetch(`/api/hackathons/${hackathon?.id}/join`, { method: "POST" });
            if (res.ok) {
                toast.success("Joined successfully!");
                fetchDetails();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to join");
            }
        } catch (e) { toast.error("Error joining"); }
    };
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const handleCreateTeam = () => {
        setIsTeamDialogOpen(true);
    };
    const submitCreateTeam = async () => {
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
                fetchDetails();
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
        <div className="container max-w-6xl mx-auto py-10 space-y-8">
            {}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {status}
                            </Badge>
                            <Badge variant="outline">
                                {hackathon.phase} Phase
                            </Badge>
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight">{hackathon.title}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            Hosted by <span className="font-semibold text-foreground underline decoration-primary/50">Protocol</span>
                        </p>
                    </div>
                    {}
                    <div className="flex flex-wrap gap-4 md:items-center">
                        {}
                        {(status === 'PUBLISHED' || status === 'ACTIVE') && (
                            <div className="flex flex-col items-end pr-4 border-r border-secondary-foreground/10">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                                    {status === 'ACTIVE' ? "Ends In" :
                                        (status === 'PUBLISHED' && new Date() > new Date(hackathon.start_date) ? "Ends In" : "Starts In")
                                    }
                                </span>
                                <span className={`text-2xl font-black font-mono leading-none ${(status === 'ACTIVE' || (status === 'PUBLISHED' && new Date() > new Date(hackathon.start_date)))
                                    ? 'text-red-500 underline decoration-red-500/30' : 'text-primary'
                                    }`}>
                                    {timeLeft}
                                </span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" className="border-secondary-foreground/20 hover:bg-secondary/20" onClick={() => router.push(`/hackathons/${hackathon.id}/leaderboard`)}>
                                <Trophy className="h-4 w-4 mr-2 text-yellow-500" /> Leaderboard
                            </Button>
                            {user_status.role === 'JUDGE' && (
                                <Button variant="default" className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95" onClick={() => router.push(`/hackathons/${hackathon.id}/judge`)}>
                                    <ShieldCheck className="h-4 w-4 mr-2" /> Judge Dashboard
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                {}
                {isOrganizerOrAdmin && (
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/20 rounded-xl border border-secondary/50 shadow-sm">
                        <div className="flex items-center gap-2 mr-4 border-r pr-4 border-secondary-foreground/10">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Organizer Tools</span>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => router.push(`/hackathons/${hackathon.id}/admin/participants`)}>
                            <UsersIcon className="h-4 w-4 mr-2" /> Participants
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => router.push(`/hackathons/${hackathon.id}/admin/settings`)}>
                            <Settings className="h-4 w-4 mr-2" /> Settings
                        </Button>
                        <AssignJudgesDialog hackathonId={hackathon.id} trigger={
                            <Button variant="secondary" size="sm">
                                <UsersIcon className="h-4 w-4 mr-2" /> Assign Judges
                            </Button>
                        } />
                        <div className="flex-1" />
                        {}
                        <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border">
                            <span className="text-[10px] font-bold px-2 uppercase text-muted-foreground">Phase</span>
                            <div className="flex gap-1">
                                {(['SUBMISSION', 'EVALUATION', 'RESULTS'] as const).map((p) => (
                                    <Button
                                        key={p}
                                        variant={hackathon.phase === p ? "default" : "ghost"}
                                        size="sm"
                                        className={`text-[10px] h-7 px-3 ${hackathon.phase === p ? 'shadow-sm' : ''}`}
                                        onClick={async () => {
                                            const res = await fetch(`/api/hackathons/${hackathon.id}`, {
                                                method: "PATCH",
                                                body: JSON.stringify({ phase: p })
                                            });
                                            if (res.ok) {
                                                toast.success(`Phase updated to ${p}`);
                                                fetchDetails();
                                            }
                                        }}
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {}
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
                {}
                <div className="space-y-6">
                    {}
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
                            {}
                            {!isJoined && status === 'PUBLISHED' && (
                                <Button
                                    className="w-full h-12 text-lg"
                                    onClick={handleJoin}
                                >
                                    <UserPlus className="mr-2 h-5 w-5" /> Join Hackathon
                                </Button>
                            )}
                            {}
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
                            {}
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
                                    {}
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
                            {}
                            {status === 'COMPLETED' && (
                                <div className="p-3 bg-muted rounded-md text-center text-sm">
                                    This hackathon has ended.
                                </div>
                            )}
                            {}
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
                    {}
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
            {}
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
            {}
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
