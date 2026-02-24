"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Calendar, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
export default function RecommendedHackathons() {
    const [recommendations, setRecommendations] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await fetch("/api/hackathons/recommendations");
                const json = await res.json();
                if (json.success) {
                    setRecommendations(json.data);
                }
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecommendations();
    }, []);
    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!recommendations || recommendations.hackathons.length === 0) {
        return null;
    }
    const isRecommended = recommendations.type === "RECOMMENDED";
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                    {isRecommended ? "Recommended For You" : "Upcoming Hackathons"}
                </h2>
                {isRecommended && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-500 border-yellow-200">
                        <Sparkles className="h-3 w-3 mr-1" /> Best Match
                    </Badge>
                )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.hackathons.map((hack: any) => (
                    <Card key={hack.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                        {isRecommended && hack.relevanceScore > 0 && (
                            <div className="absolute top-0 right-0 p-2">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100">
                                    {Math.round(hack.relevanceScore * 10)}% Match
                                </Badge>
                            </div>
                        )}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg line-clamp-1">{hack.title}</CardTitle>
                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                {hack.description || "No description provided."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap gap-1">
                                {(hack.skills || []).map((skill: string) => (
                                    <Badge key={skill} variant="outline" className="text-[10px] capitalize">
                                        {skill.replace("_", " ")}
                                    </Badge>
                                ))}
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    <span>Deadline: {hack.deadline ? new Date(hack.deadline).toLocaleDateString() : "TBD"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    <span className="capitalize">{hack.mode || "Online"}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Link href={hack.external_url} target="_blank">
                                    View Hackathon <ExternalLink className="h-3 w-3 ml-2" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
