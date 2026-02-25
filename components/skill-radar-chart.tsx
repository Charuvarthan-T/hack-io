"use client";
import React, { useEffect, useState } from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
export default function SkillRadarChart() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const fetchSkills = async () => {
        try {
            const res = await fetch("/api/student/skills");
            const json = await res.json();
            if (json.success) {
                const skills = json.skills || {};
                const taxonomy = json.taxonomy || [];
                const chartData = taxonomy.map((skill: string) => ({
                    subject: skill.replace("_", " ").toUpperCase(),
                    A: (skills[skill] || 0) * 100,
                    fullMark: 100,
                    original: skill
                }));
                setData(chartData);
                setLastUpdated(json.last_updated);
            }
        } catch (error) {
            console.error("Failed to fetch skills:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSkills();
    }, []);
    const handleManualUpdate = async (skill: string, value: number) => {
        setUpdating(true);
        try {
            const res = await fetch("/api/student/skills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skill, value })
            });
            if (res.ok) {
                toast.success("Skill updated");
                fetchSkills();
            }
        } catch (error) {
            toast.error("Error updating skill");
        } finally {
            setUpdating(false);
        }
    };
    if (loading) {
        return (
            <Card className="w-full h-[220px] p-4 flex gap-6 bg-card dark:bg-black/40 border-border dark:border-white/10 backdrop-blur-md">
                <Skeleton className="h-[180px] w-[180px] rounded-full shrink-0" />
                <div className="flex-1 space-y-4 pt-2">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                </div>
            </Card>
        );
    }
    return (
        <Card className="relative overflow-hidden group border-border dark:border-white/10 bg-card dark:bg-gradient-to-br dark:from-zinc-900 dark:to-black p-4 backdrop-blur-xl hover:scale-[1.01] hover:shadow-lg transition-all duration-200">
            { }
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-600/10 blur-[80px]" />
            <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-purple-600/10 blur-[80px]" />
            <div className="flex flex-col md:flex-row items-center gap-6">
                { }
                <div className="h-[180px] w-[180px] shrink-0 relative">
                    <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-xl animate-pulse" />
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                            <PolarGrid stroke="#ffffff" strokeOpacity={0.1} />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 500 }}
                            />
                            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Skills"
                                dataKey="A"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="url(#skillGradient)"
                                fillOpacity={0.5}
                            />
                            <defs>
                                <linearGradient id="skillGradient" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                { }
                <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                                    <Zap className="h-3.5 w-3.5 text-blue-400" />
                                    SKILL PROFILE
                                </h3>
                                <div className="relative group inline-flex h-5 items-center justify-center overflow-hidden rounded-full border border-purple-500/30 bg-purple-500/10 px-2 shadow-sm transition-colors hover:bg-purple-500/20">
                                    <span className="flex items-center gap-1.5 relative z-10 text-purple-400 font-semibold text-[9px] uppercase tracking-widest">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                                        </span>
                                        Agent Powered
                                    </span>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Normalizing activity across platform...</p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 gap-1.5 px-3 rounded-full border-border dark:border-white/10 bg-secondary/50 dark:bg-white/5 hover:bg-secondary dark:hover:bg-white/10 hover:border-blue-500/50 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider">
                                    <Plus className="h-3 w-3" /> Adjust
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-background dark:bg-zinc-950 border-border dark:border-white/10">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold tracking-tight">Sync Your Skills</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-5 py-4">
                                    {data.map((item) => (
                                        <div key={item.original} className="space-y-2.5">
                                            <div className="flex justify-between items-center px-1">
                                                <Label className="capitalize text-xs font-medium text-foreground">
                                                    {item.subject.toLowerCase()}
                                                </Label>
                                                <Badge variant="outline" className="h-5 px-2 text-[10px] font-mono border-blue-500/30 text-blue-400">
                                                    {Math.round(item.A)}%
                                                </Badge>
                                            </div>
                                            <Slider
                                                defaultValue={[item.A]}
                                                max={100}
                                                step={1}
                                                onValueCommit={(val: number[]) => handleManualUpdate(item.original, val[0])}
                                                disabled={updating}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {data.slice(0, 4).map((item) => (
                            <div key={item.original} className="rounded-lg bg-secondary/30 dark:bg-white/[0.03] border border-border/50 dark:border-white/[0.05] p-2 flex flex-col gap-1 hover:bg-secondary/50 dark:hover:bg-white/[0.05] transition-colors">
                                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">{item.subject.toLowerCase()}</span>
                                <div className="flex items-end justify-between">
                                    <span className="text-xs font-bold text-foreground">{Math.round(item.A)}%</span>
                                    <div className="h-1 w-12 bg-secondary dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${item.A}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <span className="text-[9px] text-muted-foreground italic">Last sync {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : "Never"}</span>
                        <div className="flex gap-1.5">
                            <div className="h-1 w-8 rounded-full bg-blue-500/20" />
                            <div className="h-1 w-8 rounded-full bg-blue-500/10" />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
