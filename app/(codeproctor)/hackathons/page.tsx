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
import { Plus, Calendar, Users, Trash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Hackathon {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
}

export default function HackathonsPage() {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

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

        try {
            const res = await fetch("/api/hackathons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    start_date: new Date(startDate).toISOString(),
                    end_date: new Date(endDate).toISOString(),
                    status: "DRAFT"
                }),
            });

            if (res.ok) {
                toast.success("Hackathon created successfully");
                setIsOpen(false);
                fetchHackathons();
                // Reset form
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

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hackathons</h1>
                    <p className="text-muted-foreground">
                        Manage your agentic hackathon events.
                    </p>
                </div>

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
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Creating..." : "Create Event"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

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
                                {/* Placeholder for participant count if we fetched it */}
                                <div className="flex items-center">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Participants (0)</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="flex-1">
                                View Details
                            </Button>
                            <Button 
                                variant="destructive" 
                                size="icon"
                                onClick={() => handleDelete(hack.id)}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {hackathons.length === 0 && (
                    <div className="col-span-full text-center py-10">
                        <p className="text-muted-foreground">No hackathons found. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
