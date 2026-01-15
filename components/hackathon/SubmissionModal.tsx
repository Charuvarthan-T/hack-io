"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Loader2, Link as LinkIcon } from "lucide-react";

interface SubmissionModalProps {
    hackathonId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function SubmissionModal({ hackathonId, onSuccess, trigger }: SubmissionModalProps) {
    const [open, setOpen] = useState(false);
    const [repoUrl, setRepoUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!repoUrl) {
            toast.error("Repository URL is required");
            return;
        }
        if (!file) {
            toast.error("Presentation file is required");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("repo_url", repoUrl);
            formData.append("ppt_file", file);

            const res = await fetch(`/api/hackathons/${hackathonId}/submission`, {
                method: "POST",
                body: formData,
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server Error (${res.status}): The server returned an invalid response. Check console logs.`);
            }

            if (!res.ok) {
                const errorMessage = data.details
                    ? `${data.error}: ${data.details}`
                    : (data.error || "Submission failed");
                throw new Error(errorMessage);
            }

            toast.success("Project submitted successfully!");
            setOpen(false);
            setRepoUrl("");
            setFile(null);
            onSuccess?.();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to submit project");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Submit Project</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Submit Final Project</DialogTitle>
                    <DialogDescription>
                        Upload your presentation and provide the repository link. This is the final submission.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="repo-url">Repository URL</Label>
                        <div className="relative">
                            <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="repo-url"
                                placeholder="https://github.com/..."
                                className="pl-9"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ppt-file">Presentation (PPT/PPTX/PDF)</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                            <input
                                type="file"
                                id="ppt-file"
                                accept=".ppt,.pptx,.pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                disabled={submitting}
                            />
                            {file ? (
                                <div className="flex items-center gap-2 text-primary">
                                    <span className="font-medium text-sm truncate max-w-[200px]">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">Click to upload or drag & drop</p>
                                    <p className="text-xs text-muted-foreground mt-1">Max file size 50MB</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting
                                </>
                            ) : (
                                "Submit Project"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
