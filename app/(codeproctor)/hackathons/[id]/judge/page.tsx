"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface SubmissionSummary {
    id: string;
    submitted_at: string;
    evaluation_id: string | null;
    is_draft: boolean | null;
}

export default function JudgeDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSubmissions = async () => {
        try {
            const res = await fetch(`/api/hackathons/${params.id}/judge/submissions`);
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
            } else {
                toast.error("Failed to load submissions");
            }
        } catch (error) {
            console.error("Error fetching submissions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchSubmissions();
        }
    }, [params.id]);

    const stats = {
        total: submissions.length,
        completed: submissions.filter(s => s.evaluation_id && !s.is_draft).length,
        pending: submissions.filter(s => !s.evaluation_id || s.is_draft).length
    };

    if (loading) return <div className="flex justify-center items-center py-20">Loading dashboard...</div>;

    return (
        <div className="container max-w-5xl mx-auto py-10 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Judge Dashboard</h1>
                    <p className="text-muted-foreground">Evaluation Phase - Hackathon Submissions</p>
                </div>
                <div className="flex gap-4">
                    <Card className="px-4 py-2 flex items-center gap-2 bg-secondary/30">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{stats.pending} Pending</span>
                    </Card>
                    <Card className="px-4 py-2 flex items-center gap-2 bg-green-500/10">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{stats.completed} Completed</span>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((sub, index) => (
                    <Card key={sub.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline"># {index + 1}</Badge>
                                {sub.evaluation_id ? (
                                    <Badge variant={sub.is_draft ? "secondary" : "default"} className={sub.is_draft ? "" : "bg-green-500 hover:bg-green-600"}>
                                        {sub.is_draft ? "Draft" : "Evaluated"}
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">Pending</Badge>
                                )}
                            </div>
                            <CardTitle className="mt-2 text-lg">Submission {sub.id.slice(0, 8)}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={sub.evaluation_id && !sub.is_draft ? "outline" : "default"}
                                onClick={() => router.push(`/hackathons/${params.id}/judge/evaluate/${sub.id}`)}
                            >
                                {sub.evaluation_id && !sub.is_draft ? "View Evaluation" : "Evaluate"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {submissions.length === 0 && (
                <div className="text-center py-20 bg-muted/20 rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">No submissions found for this hackathon.</p>
                </div>
            )}
        </div>
    );
}
