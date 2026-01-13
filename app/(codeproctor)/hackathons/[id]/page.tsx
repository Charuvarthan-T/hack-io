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
import { Calendar, Users, Clock, ArrowRight, UserPlus, Users as UsersIcon } from "lucide-react";

interface HackathonDetails {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED";
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

    useEffect(() => {
        if (params.id) {
            fetchDetails();
        }
    }, [params.id]);

    // Timer Logic
    useEffect(() => {
        if (!hackathon) return;

        const targetDate = hackathon.status === 'PUBLISHED'
            ? new Date(hackathon.start_date)
            : new Date(hackathon.end_date);

        const updateTimer = () => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft(hackathon.status === 'PUBLISHED' ? "Started!" : "Ended");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        };

        const interval = setInterval(updateTimer, 60000); // Update every minute
        updateTimer(); // Initial call

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

    const handleEnterWorkspace = () => {
        if (hackathon?.user_status.team) {
            // router.push(`/hackathons/${hackathon.id}/team/${hackathon.user_status.team.id}`);
            toast.info("Entering Team Workspace... (Coming Soon)");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading details...</div>;
    if (!hackathon) return <div className="p-10 text-center">Hackathon not found.</div>;

    const { status, user_status } = hackathon;
    const isJoined = !!user_status.role;
    const hasTeam = !!user_status.team;

    return (
        <div className="container max-w-4xl mx-auto py-10 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Badge className="mb-2" variant={status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight">{hackathon.title}</h1>
                    <p className="text-muted-foreground mt-1">
                        Hosted by Protocol (Organizer)
                    </p>
                </div>

                {/* Countdown Card */}
                {(status === 'PUBLISHED' || status === 'ACTIVE') && (
                    <Card className="min-w-[200px] bg-secondary/50 border-none">
                        <CardContent className="p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">
                                {status === 'PUBLISHED' ? "Starts In" : "Time Remaining"}
                            </p>
                            <p className="text-2xl font-mono font-bold text-primary mt-1">
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
                                        <p className="text-xs text-muted-foreground">{user_status.team?.member_count} Members</p>
                                    </div>
                                    <Button
                                        className="w-full"
                                        variant="secondary" // Prominent but not primary if event not started, adjust logic if needed
                                        onClick={handleEnterWorkspace}
                                    >
                                        Enter Workspace <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {/* State: Completed */}
                            {status === 'COMPLETED' && (
                                <div className="p-3 bg-muted rounded-md text-center text-sm">
                                    This hackathon has ended.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Resources / Links (Placeholder) */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Resources</CardTitle>
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
        </div>
    );
}
