"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck,
    Trophy,
    ArrowRight,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Code,
    Users
} from "lucide-react";
interface HackathonInfo {
    id: string;
    title: string;
    phase: string;
    status: string;
    total_submissions: number;
    evaluated_submissions: number;
}
export default function JudgeDashboard() {
    const { data: session } = useSession();
    const user = session?.user;
    const [hackathons, setHackathons] = useState<HackathonInfo[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchHackathons = async () => {
            try {
                const res = await fetch("/api/judge/hackathons");
                const data = await res.json();
                if (data.hackathons) {
                    setHackathons(data.hackathons);
                }
            } catch (error) {
                console.error("Error fetching hackathons:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHackathons();
    }, []);
    return (
        <div className="space-y-8 p-6">
            {}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter">
                        Welcome back, {user?.name}! 🛡️
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        You are logged in with Judge privileges. Track your evaluation progress across assigned events.
                    </p>
                </div>
                <Badge variant="default" className="flex items-center gap-2 bg-primary px-4 py-1 text-sm font-bold shadow-lg shadow-primary/20">
                    <ShieldCheck className="h-4 w-4" />
                    Judge Portal
                </Badge>
            </div>
            {}
            <div className="space-y-4">
                <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Assigned Hackathons
                </h2>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse bg-secondary/20 h-48" />
                        ))}
                    </div>
                ) : hackathons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hackathons.map((h) => {
                            const progress = h.total_submissions > 0
                                ? Math.round((h.evaluated_submissions / h.total_submissions) * 100)
                                : 0;
                            return (
                                <Card key={h.id} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-primary/5 hover:border-primary/20 overflow-hidden">
                                    <div className="h-2 w-full bg-secondary/30">
                                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="uppercase text-[10px] font-black tracking-widest bg-background/50">
                                                {h.phase} Phase
                                            </Badge>
                                            <span className="text-xs font-bold text-muted-foreground">{progress}% Done</span>
                                        </div>
                                        <CardTitle className="text-xl font-black leading-tight mt-2 line-clamp-1">{h.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center bg-secondary/20 p-3 rounded-lg border border-secondary/50">
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Submissions</p>
                                                <p className="text-lg font-black">{h.total_submissions}</p>
                                            </div>
                                            <div className="h-8 w-px bg-secondary-foreground/10" />
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase text-primary">Evaluated</p>
                                                <p className="text-lg font-black text-primary">{h.evaluated_submissions}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-primary/5 border-t border-primary/5 flex flex-col gap-2">
                                        <Button asChild className="w-full font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="ghost">
                                            <Link href={`/hackathons/${h.id}/judge`}>
                                                Go to Judging Queue <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button asChild className="w-full font-black uppercase text-xs tracking-widest border-primary/20 text-primary hover:bg-primary/10" variant="outline">
                                            <Link href={`/hackathons/${h.id}/leaderboard`}>
                                                <Trophy className="mr-2 h-3 w-3" /> View Leaderboard
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="border-dashed bg-secondary/5">
                        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                            <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-lg font-bold text-muted-foreground">No assigned hackathons found.</p>
                            <p className="text-sm text-muted-foreground mt-1">You'll see events here once an organizer assigns you as a judge.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            {}
            <Card className="bg-primary/5 border-primary/20 shadow-inner">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 font-bold">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        Judging Instructions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        Click on any assigned hackathon to start your judging queue. The system will automatically guide you through
                        each anonymized submission. All scores are automatically weighted and averaged with other judges to form
                        the final leaderboard for the event.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
