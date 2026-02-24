"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Calendar, Users, Trash, UserPlus, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecommendedHackathons from "@/components/recommended-hackathons";
import { useSession } from "next-auth/react";
interface Hackathon {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    created_by: string;
    user_role?: string;
    participant_count?: number;
}
import { useRouter } from "next/navigation";
export default function HackathonsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [maxTeamSize, setMaxTeamSize] = useState(4);
    const canCreate = session?.user?.role === 'admin' || session?.user?.role === 'faculty';
    const canDelete = (hack: Hackathon) => {
        if (!session?.user) return false;
        return session.user.role === 'admin' || session.user.id === hack.created_by;
    };
    const fetchHackathons = async () => {
        try {
            const res = await fetch("/api/hackathons");
            if (res.ok) {
                const data = await res.json();
                setHackathons(data);
            }
        } catch (error) {
            console.error("Failed to fetch hackathons");
        }
    };
    useEffect(() => {
        fetchHackathons();
    }, []);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (maxTeamSize < 1) {
            toast.error("Team size must be at least 1");
            setLoading(false);
            return;
        }
        try {
            const res = await fetch("/api/hackathons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    start_date: new Date(startDate).toISOString(),
                    end_date: new Date(endDate).toISOString(),
                    status: "DRAFT",
                    max_team_size: maxTeamSize
                }),
            });
            if (res.ok) {
                toast.success("Hackathon created successfully");
                setIsOpen(false);
                fetchHackathons();
                setTitle("");
                setDescription("");
                setStartDate("");
                setEndDate("");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create hackathon");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this hackathon?")) return;
        try {
            const res = await fetch(`/api/hackathons/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Hackathon deleted");
                fetchHackathons();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };
    const handleJoin = async (id: string) => {
        try {
            const res = await fetch(`/api/hackathons/${id}/join`, {
                method: "POST",
            });
            if (res.ok) {
                toast.success("Successfully joined hackathon!");
                fetchHackathons();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to join");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };
    const handlePublish = async (id: string) => {
        if (!confirm("Are you sure you want to PUBLISH this hackathon? Participants will be able to join.")) return;
        try {
            const res = await fetch(`/api/hackathons/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "PUBLISHED" }),
            });
            if (res.ok) {
                toast.success("Hackathon Published!");
                fetchHackathons();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to publish");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };
    const [participantsOpen, setParticipantsOpen] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [selectedHackathonId, setSelectedHackathonId] = useState<string | null>(null);
    const handleViewParticipants = async (hackId: string) => {
        try {
            const res = await fetch(`/api/hackathons/${hackId}/participants`);
            if (res.ok) {
                const data = await res.json();
                setParticipants(data);
                setSelectedHackathonId(hackId);
                setParticipantsOpen(true);
            } else {
                toast.error("Failed to fetch participants");
            }
        } catch (error) {
            toast.error("Error fetching participants");
        }
    };
    return (
        <div className="p-6 space-y-6">
            {}
            <Dialog open={participantsOpen} onOpenChange={setParticipantsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Participants</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {participants.length === 0 ? (
                            <p className="text-center text-muted-foreground">No participants yet.</p>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-secondary text-secondary-foreground">
                                        <tr>
                                            <th className="p-3">Name</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Role</th>
                                            <th className="p-3">Joined</th>
                                            <th className="p-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {participants.map((p) => (
                                            <tr key={p.id} className="border-t">
                                                <td className="p-3 font-medium">{p.name || "Unknown"}</td>
                                                <td className="p-3 text-muted-foreground">{p.email}</td>
                                                <td className="p-3">
                                                    <Badge variant="outline">{p.role}</Badge>
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    {new Date(p.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-3">
                                                    {}
                                                    {selectedHackathonId && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                                            onClick={async () => {
                                                                if (!confirm("Remove this participant?")) return;
                                                                try {
                                                                    const res = await fetch(`/api/hackathons/${selectedHackathonId}/participants`, {
                                                                        method: 'DELETE',
                                                                        body: JSON.stringify({ targetUserId: p.id })
                                                                    });
                                                                    if (res.ok) {
                                                                        toast.success("Removed");
                                                                        handleViewParticipants(selectedHackathonId);
                                                                        fetchHackathons();
                                                                    } else {
                                                                        toast.error("Failed to remove");
                                                                    }
                                                                } catch (e) { toast.error("Error"); }
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hackathons</h1>
                    <p className="text-muted-foreground">
                        Manage your agentic hackathon events.
                    </p>
                </div>
                {canCreate && (
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Create Hackathon
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Hackathon</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        placeholder="Hackathon Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Event details..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start">Start Date</Label>
                                        <Input
                                            id="start"
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end">End Date</Label>
                                        <Input
                                            id="end"
                                            type="datetime-local"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="maxSize">Max Team Size</Label>
                                        <Input
                                            id="maxSize"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={maxTeamSize}
                                            onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Creating..." : "Create Event"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            {}
            {session?.user?.role === 'student' && (
                <RecommendedHackathons />
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {hackathons.map((hack) => (
                    <Card key={hack.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{hack.title}</CardTitle>
                                <Badge variant={hack.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                    {hack.status}
                                </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                                {hack.description || "No description provided."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>{new Date(hack.start_date).toLocaleDateString()}</span>
                                </div>
                                {}
                                <div className="flex items-center">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Participants ({hack.participant_count || 0})</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            {}
                            {canDelete(hack) || hack.user_role === 'JUDGE' ? (
                                <Button variant="outline" className="flex-1" onClick={() => router.push(`/hackathons/${hack.id}/admin/participants`)}>
                                    <Users className="w-4 h-4 mr-2" /> Participants
                                </Button>
                            ) : (
                                <Button variant="outline" className="flex-1" onClick={() => router.push(`/hackathons/${hack.id}`)}>
                                    View Details
                                </Button>
                            )}
                            {}
                            {hack.user_role ? (
                                <Badge variant="outline" className="ml-2 h-9 px-3 border-green-500 text-green-500">
                                    {hack.user_role}
                                </Badge>
                            ) : (
                                hack.status === 'PUBLISHED' && (
                                    <Button
                                        variant="secondary"
                                        className="ml-2"
                                        onClick={() => handleJoin(hack.id)}
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" /> Join
                                    </Button>
                                )
                            )}
                            {}
                            {canDelete(hack) && hack.status === 'DRAFT' && (
                                <Button
                                    variant="default"
                                    size="icon"
                                    className="ml-2 bg-green-600 hover:bg-green-700"
                                    onClick={() => handlePublish(hack.id)}
                                    title="Publish Hackathon"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            )}
                            {}
                            {canDelete(hack) && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="ml-2"
                                    onClick={() => handleDelete(hack.id)}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
                {hackathons.length === 0 && (
                    <div className="col-span-full text-center py-10">
                        {canCreate ? (
                            <p className="text-muted-foreground">No hackathons found. Create one to get started.</p>
                        ) : (
                            <p className="text-muted-foreground">No upcoming hackathons found.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
