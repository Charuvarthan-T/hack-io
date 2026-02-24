"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, ShieldCheck, Save, Send, ArrowRight } from "lucide-react";
interface BlindSubmission {
    id: string;
    repo_url: string;
    ppt_object_key: string;
    hackathon_title: string;
    submitted_at: string;
}
const RUBRIC = [
    { id: "ui", label: "User Interface", description: "Visual aesthetics and design consistency." },
    { id: "backend", label: "Backend / Architecture", description: "Database design, API structure, and logic." },
    { id: "graphs", label: "Data Visualization / Graphs", description: "Clarity and utility of graphs/analytics." },
    { id: "discord_interaction", label: "Discord Interaction", description: "Engagement and interaction in Discord." },
    { id: "innovation", label: "Innovation", description: "Novelty and uniqueness of the idea." },
    { id: "technical_complexity", label: "Technical Complexity", description: "Level of technical challenge and skill shown." },
    { id: "implementation_quality", label: "Implementation Quality", description: "Code quality, stability, and completion." },
    { id: "ui_ux", label: "Overall UI/UX", description: "General usability and user experience." },
    { id: "impact", label: "Impact / Practicality", description: "Potential real-world impact and feasibility." },
    { id: "presentation_quality", label: "Presentation Quality", description: "Quality of the demo and explanation." }
];
export default function EvaluationPage() {
    const params = useParams();
    const router = useRouter();
    const [submission, setSubmission] = useState<BlindSubmission | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({
        innovation: 0, technical_complexity: 0, implementation_quality: 0,
        ui_ux: 0, impact: 0, presentation_quality: 0,
        ui: 0, backend: 0, graphs: 0, discord_interaction: 0
    });
    const [feedback, setFeedback] = useState("");
    const [isDraft, setIsDraft] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [readOnly, setReadOnly] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const subRes = await fetch(`/api/hackathons/${params.id}/judge/submissions?submissionId=${params.submissionId}`);
                if (subRes.ok) setSubmission(await subRes.json());
                const evalRes = await fetch(`/api/hackathons/${params.id}/evaluations?submissionId=${params.submissionId}`);
                if (evalRes.ok) {
                    const data = await evalRes.json();
                    if (data.id) {
                        setScores({
                            innovation: data.innovation_score,
                            technical_complexity: data.technical_complexity_score,
                            implementation_quality: data.implementation_quality_score,
                            ui_ux: data.ui_ux_score,
                            impact: data.impact_score,
                            presentation_quality: data.presentation_quality_score,
                            ui: data.ui_score || 0,
                            backend: data.backend_score || 0,
                            graphs: data.graphs_score || 0,
                            discord_interaction: data.discord_interaction_score || 0
                        });
                        setFeedback(data.feedback || "");
                        setIsDraft(data.is_draft);
                        if (!data.is_draft) setReadOnly(true);
                    }
                }
            } catch (error) {
                toast.error("Error loading data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id, params.submissionId]);
    const handleScoreChange = (id: string, value: number[]) => {
        if (readOnly) return;
        setScores(prev => ({ ...prev, [id]: value[0] }));
    };
    const goToNext = async () => {
        try {
            const res = await fetch(`/api/hackathons/${params.id}/judge/next-submission`);
            const { nextSubmissionId } = await res.json();
            if (nextSubmissionId) {
                router.push(`/hackathons/${params.id}/judge/evaluate/${nextSubmissionId}`);
            } else {
                toast.success("Great job! All assigned submissions have been evaluated.");
                router.push(`/hackathons/${params.id}/judge`);
            }
        } catch (error) {
            toast.error("Evaluation saved, but failed to find next submission.");
            router.push(`/hackathons/${params.id}/judge`);
        }
    };
    const handleSubmit = async (final: boolean) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/hackathons/${params.id}/evaluations`, {
                method: "POST",
                body: JSON.stringify({
                    submissionId: params.submissionId,
                    innovation_score: scores.innovation,
                    technical_complexity_score: scores.technical_complexity,
                    implementation_quality_score: scores.implementation_quality,
                    ui_ux_score: scores.ui_ux,
                    impact_score: scores.impact,
                    presentation_quality_score: scores.presentation_quality,
                    ui_score: scores.ui,
                    backend_score: scores.backend,
                    graphs_score: scores.graphs,
                    discord_interaction_score: scores.discord_interaction,
                    feedback,
                    is_draft: !final
                })
            });
            if (res.ok) {
                toast.success(final ? "Evaluation submitted final!" : "Draft saved!");
                if (final) {
                    await goToNext();
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(`Failed: ${errorData.details || "Unknown error"}`);
            }
        } catch (error) {
            toast.error("Error saving: Check console for details");
        } finally {
            setIsSaving(false);
        }
    };
    if (loading) return <div className="flex justify-center items-center py-20">Loading evaluation form...</div>;
    if (!submission) return <div className="text-center py-20">Submission not found</div>;
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    return (
        <div className="container max-w-6xl mx-auto py-10 space-y-8">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-muted-foreground">Queue Mode</Badge>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Project Details</CardTitle>
                            <CardDescription>Evaluation Queue # {submission.id.slice(0, 8)}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-md flex items-center gap-2 text-sm text-blue-500">
                                <ShieldCheck className="h-4 w-4" /> Student & Team identity hidden
                            </div>
                            <div>
                                <Label className="text-xs uppercase text-muted-foreground">GitHub Repository</Label>
                                <a href={submission.repo_url} target="_blank" className="flex items-center gap-2 text-primary hover:underline mt-1">
                                    {submission.repo_url} <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                            <div>
                                <Label className="text-xs uppercase text-muted-foreground">Presentation / Demo</Label>
                                <div className="p-2 bg-secondary/30 rounded-md mt-1 break-all text-xs font-mono">
                                    {submission.ppt_object_key}
                                </div>
                                <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Demo link would open here"); }} className="flex items-center gap-2 text-primary hover:underline mt-2 text-sm font-semibold">
                                    View Link <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 border-t pt-6 bg-primary/5">
                            <div className="w-full text-center">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Score</p>
                                <p className="text-6xl font-black mt-2 text-primary">{totalScore}<span className="text-xl text-muted-foreground">/100</span></p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
                {}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-2xl font-black tracking-tight">Scoring Rubric</CardTitle>
                                {readOnly && <Badge variant="default" className="bg-green-600 px-3 py-1">Evaluated</Badge>}
                            </div>
                            <CardDescription>Slide to award points. Your final score will be saved for this anonymized team.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-10 pt-4">
                            <div className="grid grid-cols-1 gap-12">
                                {RUBRIC.map((item) => (
                                    <div key={item.id} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <Label className="text-lg font-bold">{item.label}</Label>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-3xl font-black text-primary leading-none">{scores[item.id]}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">pts</span>
                                            </div>
                                        </div>
                                        <Slider
                                            disabled={readOnly}
                                            value={[scores[item.id]]}
                                            max={10}
                                            step={1}
                                            onValueChange={(val) => handleScoreChange(item.id, val)}
                                            className="py-4"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3 pt-6 border-t">
                                <Label className="text-lg font-bold">Judge's Notes</Label>
                                <Textarea
                                    disabled={readOnly}
                                    placeholder="Add any specific observations or feedback for the organizers/participants..."
                                    className="min-h-[150px] bg-secondary/10 border-secondary focus:bg-background transition-all"
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center gap-3 border-t p-6 bg-secondary/5">
                            {!readOnly ? (
                                <>
                                    <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isSaving} className="border-primary/20 hover:bg-primary/5">
                                        <Save className="mr-2 h-4 w-4" /> Save Draft
                                    </Button>
                                    <Button size="lg" onClick={() => handleSubmit(true)} disabled={isSaving} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 px-8 font-bold">
                                        <Send className="mr-2 h-4 w-4" /> Finalize & Next Submission
                                    </Button>
                                </>
                            ) : (
                                <div className="flex w-full justify-between items-center">
                                    <p className="text-sm text-muted-foreground italic">You have finalized this evaluation.</p>
                                    <Button onClick={goToNext} className="font-bold">
                                        Go to Next Pending <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
